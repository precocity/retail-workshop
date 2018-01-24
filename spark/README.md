# retail-workshop / spark
#### Requires:
* Java 8
* Maven 3.2.x
* Git

#### Installation:
1. Clone the project ```git clone https://github.com/precocity/retail-workshop.git```
2. ```cd retail-workshop/spark```
3. ```mvn clean install```
4. The deployable artifact will be `target/retail-workshop-${VERSION}.jar`

#### Layout:
The Spark application has two main classes:
1. Batch job to score raw product review data: ```com.precocity.retail.workshop.app.ScoringApp```
2. Streaming job to score reviews in realtime: ```com.precocity.retail.workshop.app.StreamingApp```

Both the classes take _exactly one_ argument that is the path to the application configuration JSON file. This should be stored in a secured place with limited read access as it contains confidential infromation.

#### Application Configuration:
Sample application configuration JSON file `application-config-sample.json` is present under the `spark/src/main/resources` folder. Here's a brief description of the configuration and the fields present in it:
1. `spark` - Configuration object for Spark.
    1. `progressDir` - Location for Azure EventHubs util to store the offsets. http://bit.ly/2BoxOgZ
    2. `checkpointDir` - Location for Spark checkpointing. http://bit.ly/2DuB3oW
    3. `batchDurationSec` - Batch interval for the Spark Streaming job (in seconds).
    4. `checkpointIntervalSec` - Checkpointing interval for Spark (in seconds).
    5. `modelPath` - Path to the directory containing the saved `PipelineModel`
    6. `rawReviewFiles` - Path to the directory containing the raw Amazon product review files. http://bit.ly/2yufo0W  
2. `eventHubs` - Configuration object for Azure EventHubs.
    1. `policyName` - `RootManageSharedAccessKey`
    2. `policyKey` - EventHubs policy key, this is a base64 encoded key found on the Azure portal.
    3. `namespace` - Namespace of your EventHubs.
    4. `partitions` - The no. of partitions for your EventHubs. http://bit.ly/2DtP3PN
    5. `consumerGroup` - Identifier for the consumer group for the EventHubs client. Use `$Default` if you choose not to customize. http://bit.ly/2DtP3PN
    6. `maxRate` - The expected rate at which messages arrive.
3. `cosmosDB` - Configuration object for Azure CosmosDB.
    1. `endpoint` - CosmosDB endpoint. Usually of this format: `https://<cosmosdb-account-name>.documents.azure.com:443/`.
    2. `masterKey` - Master key, this is based64 encoded and can be found on your Azure Portal's CosmosDB service page.
    3. `database` - Name of the database.
    4. `preferredRegions` - Preferred regions that were setup for this CosmosDB database. Usually of this format: `East US2;Central US;`
    5. `collectionName` - Name of the collection in the CosmosDB Database.
    6. `writingBatchSize` - No. of records to write to the collection at a time. This value multiplied by the number of executors should be less than or equal to the configured Write RUs on the CosmosDB databse.
    
#### Spark Runtime Dependencies:
1. `com.microsoft.azure:azure-eventhubs:0.15.1`
2. `com.microsoft.azure:azure-eventhubs-spark_2.11:2.1.6`
3. `com.microsoft.azure:azure-cosmosdb-spark_2.1.0_2.11:1.0.0`
4. `joda-time:joda-time:2.9.9`

#### Spark Commands:
_Note: Be sure to update `<container>` and `<storage-acc>` in the below commands appropriately._
##### Batch Job:
`/usr/lib/spark/bin/spark-submit --class com.precocity.retail.workshop.app.ScoringApp --packages com.microsoft.azure:azure-eventhubs:0.15.1,com.microsoft.azure:azure-eventhubs-spark_2.11:2.1.6,com.microsoft.azure:azure-cosmosdb-spark_2.1.0_2.11:1.0.0,joda-time:joda-time:2.9.9 --conf spark.executor.instances=4 --conf spark.executor.memory=20g wasb://<container>@<storage-acc>.blob.core.windows.net/retail-workshop-1.0.jar wasb://<container>@<storage-acc>.blob.core.windows.net/score-application-config.json`
##### Streaming Job:
`/usr/lib/spark/bin/spark-submit --class com.precocity.retail.workshop.app.StreamingApp --packages com.microsoft.azure:azure-eventhubs:0.15.1,com.microsoft.azure:azure-eventhubs-spark_2.11:2.1.6,com.microsoft.azure:azure-cosmosdb-spark_2.1.0_2.11:1.0.0,joda-time:joda-time:2.9.9 wasb://<container>@<storage-acc>.blob.core.windows.net/retail-workshop-1.0.jar wasb://<container>@<storage-acc>.blob.core.windows.net/application-config.json`
