/*
 * Copyright (C) 2018 Precocity LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.precocity.retail.workshop.app

import com.microsoft.azure.cosmosdb.spark.schema._
import com.precocity.retail.workshop.model.StreamingAppArg
import org.apache.spark.SparkContext
import org.apache.spark.ml.PipelineModel
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.functions._
import org.apache.spark.sql.{SQLContext, SaveMode}
import org.apache.spark.streaming.eventhubs.EventHubsUtils
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.json4s.DefaultFormats
import org.json4s.jackson.Serialization.read
import org.slf4j.{Logger, LoggerFactory}

import scala.collection.mutable

/**
  * Spark streaming application that would listen to an EventHubs topic and score the raw reviews in realtime.
  */
object StreamingApp extends BaseApp {

  private val logger:Logger = LoggerFactory.getLogger(StreamingApp.getClass)

  /**
    * Application main method.
    * @param args Path to the configuration JSON file. The file will be read using Spark so the file scheme needs to be
    *             understadeable by Spark.
    */
  def main(args: Array[String]): Unit = {

    // Exit if the required argument (path to app config json) is missing
    if(args.length != 1) {
      logger.error("Required argument missing. Please provide the path to the application configuration JSON file.")
      sys.exit(1)
    }

    // Import implicits for json4s
    implicit val formats = DefaultFormats

    // Create SparkConf and initialize SparkContext
    val sparkConf = generateSparkConf("RetailWorkshopDemo-Streaming")
    val sc = new SparkContext(sparkConf)

    // Read the application config JSON
    val appArgJson: String = sc.textFile(args(0)).collect().mkString("")

    // Unmarshal the JSON to the arg object
    val appArg: StreamingAppArg = read[StreamingAppArg](appArgJson)

    // Create Spark streaming context
    val streamingContext = createStreamingContext(appArg, sc)

    // Start the streaming context and wait until termination
    streamingContext.start()
    streamingContext.awaitTermination()
  }

  /**
    * Method to initialze a Spark streaming context.
    * @param appArg
    * @param sc
    * @return
    */
  def createStreamingContext(appArg: StreamingAppArg, sc: SparkContext): StreamingContext = {

    // Init the sql context
    val sqlContext = SQLContext.getOrCreate(SparkContext.getOrCreate())
    import sqlContext.implicits._

    // Init EventHubs parameters
    val eventHubsParams = initEventHubsParams(appArg.eventHubs)

    // Init CosmosDB config
    val writeConfig = initCosmosDBConfig(appArg.cosmosDB)

    // Initialize the Spark streaming context
    val streamingContext = new StreamingContext(sc, Seconds(appArg.spark.batchDurationSec))

    // Create DirectStream for the EventHubs topic
    val inputDirectStream = EventHubsUtils.createDirectStreams(streamingContext, appArg.eventHubs.namespace, appArg.spark.progressDir, Map(appArg.eventHubs.name -> eventHubsParams))

    // Set checkpoint interval
    inputDirectStream.checkpoint(Seconds(appArg.spark.checkpointIntervalSec))

    // Load the trained model
    var preTrainedModel = PipelineModel.read.load(appArg.spark.modelPath)

    // UDF to extract the probability from a feature vector
    val getPOne = udf((v: org.apache.spark.ml.linalg.Vector) => v(0))

    // Create the handler for each RDD arriving after a batch interval
    // This loop gets executed for each batch interval until the streaming context is terminated
    inputDirectStream.foreachRDD { rdd =>
      try {

        // If there are reviews in the current batch then proceed, else skip
        if (!rdd.isEmpty()) {

          // Read the raw reviews into an RDD and convert to a JSON based DataFrame
          val events: RDD[String] = rdd.map(eventData => new String(eventData.getBody))
          val df = sqlContext.read.json(events)

          // Below steps are exactly similar to the flow of the ScoringApp

          // Create the fullReview column by concatenating the summary and reviewText columns
          var updatedDf = df.withColumn("fullReview", concat(df("summary"), lit(" "), df("reviewText")))

          // Score the raw reviews using the loaded trained model
          val rawScoredDf = preTrainedModel.transform(updatedDf)

          // Label the probability column as good_score as it indicates the probability of a review being treated as "good"
          val scoredDf = rawScoredDf.select($"asin", $"helpful", $"overall", $"reviewText", $"reviewTime", $"reviewerID", $"reviewerName", $"summary", $"unixReviewTime", $"category", getPOne($"probability").alias("good_score"))

          // Create a helpfulRatio column that gives the ratio of total upvotes to total votes
          val ratioUDF= udf((x:mutable.WrappedArray[Long]) => if(x(1) == 0) 0 else 1.0*x(0)/(1.0*x(1)))
          val finalDf = scoredDf.withColumn("helpfulRatio", ratioUDF($"helpful"))

          // Finally, save the dataframe to CosmosDB
          finalDf.write.mode(SaveMode.Append).cosmosDB(writeConfig)
        }
      } catch {
        case x: Throwable => {logger.error("Error occurred, moving on.."); x.printStackTrace}
      }
    }

    // Set the checkpoint directory for the spark streaming job
    streamingContext.checkpoint(appArg.spark.checkpointDir)

    streamingContext
  }

}
