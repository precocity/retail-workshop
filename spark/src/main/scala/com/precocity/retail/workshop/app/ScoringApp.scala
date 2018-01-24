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

import com.microsoft.azure.cosmosdb.spark.config.Config
import com.microsoft.azure.cosmosdb.spark.schema._
import com.precocity.retail.workshop.model.ScoringAppArg
import org.apache.spark.SparkContext
import org.apache.spark.ml.PipelineModel
import org.apache.spark.sql._
import org.apache.spark.sql.functions._
import org.json4s.DefaultFormats
import org.slf4j.{Logger, LoggerFactory}

import org.json4s.jackson.Serialization.read

import scala.collection.mutable
import scala.collection.mutable.ListBuffer

/**
  * Spark application to score all the raw review data given a trained ML model.
  */
object ScoringApp extends BaseApp {

  private val logger:Logger = LoggerFactory.getLogger(ScoringApp.getClass)

  def main(args:Array[String]): Unit = {

    // Exit if the required argument (path to app config json) is missing
    if(args.length != 1) {
      logger.error("Required argument missing. Please provide the path to the application configuration JSON file.")
      sys.exit(1)
    }

    // Import implicits for json4s
    implicit val formats = DefaultFormats

    // Create SparkConf and initialize SparkContext
    val sparkConf = generateSparkConf("RetailWorkshopDemo-Scoring")
    val sc = new SparkContext(sparkConf)
    val sqlContext = new org.apache.spark.sql.SQLContext(sc)
    import sqlContext.implicits._

    // Read the application config JSON
    val appArgJson: String = sc.textFile(args(0)).collect().mkString("")

    // Unmarshal the JSON to the arg object
    val appArg: ScoringAppArg = read[ScoringAppArg](appArgJson)

    // Initialize the CosmosDB configuration
    val writeConfig: Config = initCosmosDBConfig(appArg.cosmosDB)

    // Get the list of files which contains the raw reviews to score
    val allFiles = appArg.spark.rawReviewFiles

    // Read each of the files sequentially and create a list of dataframes
    // Extract the category from the file name and add it as a column too
    var allDFS = new ListBuffer[DataFrame]()
    val pattern = ".*/reviews_(.*)_5.*".r
    allFiles.foreach( filename => {
      val pattern(category) = filename
      var df = sqlContext.read.json(filename)
      df = df.withColumn("category",lit(category))
      allDFS += df
    })

    // The input dataframe will be union of all the dataframes created per file
    var inputDf = allDFS.toList.reduce(_ union _)

    // Load the pre trained pipeline model
    var preTrainedModel = PipelineModel.read.load(appArg.spark.modelPath)

    // UDF to extract the probability from a given feature vector
    val getPOne = udf((v: org.apache.spark.ml.linalg.Vector) => v(0))

    // Create a column - fullReview - by concatenating summary and reviewText columns
    var updatedDf = inputDf.withColumn("fullReview", concat(inputDf("summary"), lit(" "), inputDf("reviewText")))

    // Transform, i.e., score the raw reviews using the loaded ML model
    val rawScoredDf = preTrainedModel.transform(updatedDf)

    // Label the probability column as good_score as it indicates the probability of a review being treated as "good"
    val scoredDf = rawScoredDf.select($"asin", $"helpful", $"overall", $"reviewText", $"reviewTime", $"reviewerID", $"reviewerName", $"summary", $"unixReviewTime", $"category", getPOne($"probability").alias("good_score"))

    // Create a helpfulRatio column that gives the ratio of total upvotes to total votes
    val ratioUDF= udf((x:mutable.WrappedArray[Long]) => if(x(1) == 0) 0 else 1.0*x(0)/(1.0*x(1)))
    val finalDf = scoredDf.withColumn("helpfulRatio", ratioUDF($"helpful"))

    // Finally, save the dataframe to CosmosDB
    finalDf.write.mode(SaveMode.Append).cosmosDB(writeConfig)
  }
}
