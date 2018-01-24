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
import com.precocity.retail.workshop.model.{CosmosDBArg, EventHubsArg}
import org.apache.spark.SparkConf

/**
  * Base application class.
  */
class BaseApp {
  /**
    * Method that will take an application name and create a SparkConf.
    * This can be extended to included any other common application settings.
    * @param appName
    * @return
    */
  def generateSparkConf(appName: String): SparkConf = {
    val sparkConf = new SparkConf().setAppName(appName)
    sparkConf.set("spark.app.name", appName)
    sparkConf
  }

  /**
    * Method to create and init the CosmosDB configuration object.
    * @param arg
    * @return
    */
  def initCosmosDBConfig(arg: CosmosDBArg): Config = {
    val writeConfig = Config(Map("Endpoint" -> arg.endpoint,
      "Masterkey" -> arg.masterKey,
      "Database" -> arg.database,
      "PreferredRegions" -> arg.preferredRegions,
      "Collection" -> arg.collection,
      "WritingBatchSize" -> arg.writingBatchSize))
    writeConfig
  }

  /**
    * Method to create and init the parameters map required for configuring EventHubs client.
    * @param arg
    * @return
    */
  def initEventHubsParams(arg: EventHubsArg): Map[String, String] = {
    val eventhubParameters = Map[String, String] (
      "eventhubs.policyname" -> arg.policyName,
      "eventhubs.policykey" -> arg.policyKey,
      "eventhubs.namespace" -> arg.namespace,
      "eventhubs.name" -> arg.name,
      "eventhubs.progressTrackingDir" -> ".",
      "eventhubs.partition.count" -> arg.partitions,
      "eventhubs.consumergroup" -> arg.consumerGroup,
      "eventhubs.maxRate" -> arg.maxRate
    )
    eventhubParameters
  }
}
