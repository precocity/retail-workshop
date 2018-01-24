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

package com.precocity.retail.workshop.model

/**
  * Case class to model the arguments for Spark.
  * @param progressDir
  * @param checkpointDir
  * @param batchDurationSec
  * @param modelPath
  */
case class SparkArg(progressDir: String, checkpointDir: String, batchDurationSec: Int, checkpointIntervalSec: Int, modelPath: String, rawReviewFiles: Array[String])

/**
  * Case class to model the arguments for EventHubs.
  * @param policyName
  * @param policyKey
  * @param namespace
  * @param name
  * @param partitions
  * @param consumerGroup
  * @param maxRate
  */
case class EventHubsArg(policyName: String, policyKey: String, namespace: String, name: String, partitions: String, consumerGroup: String, maxRate: String)

/**
  * Case class to model the argument for CosmosDB.
  * @param endpoint
  * @param masterKey
  * @param database
  * @param preferredRegions
  * @param collection
  * @param writingBatchSize
  */
case class CosmosDBArg(endpoint: String, masterKey: String, database: String, preferredRegions: String, collection: String, writingBatchSize: String)

/**
  * Case class to model the argument for the streaming application.
  * @param spark
  * @param eventHubs
  * @param cosmosDB
  */
case class StreamingAppArg(spark: SparkArg, eventHubs: EventHubsArg, cosmosDB: CosmosDBArg)

/**
  *  Case class to model the argument for the scoring application.
  * @param spark
  * @param cosmosDB
  */
case class ScoringAppArg(spark: SparkArg, cosmosDB: CosmosDBArg)