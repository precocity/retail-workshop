## Precocity's Retail Workshop on Qubole/Azure
This repo contains an end-to-end retail analytical workshop that demostrates the power of Qubole/Azure to predict the helpfulness of product reviews.  It consistes of the 3 components/directories

1. **notebooks** : Qubole Zeppelin Notebooks that describe & implement the Natural Lanaguage Processing (NLP) and Machine Learning (ML) pipelines in batch
2. **spark** : A Spark application with 2 main classes: A batch job to score all reviews and a Spark streaming job that scores reviews in real time
2. **ui** : A Node.JS app w/ Azure Cosmo DB & Event Hub that demonstrates the retail benefit of predicting the helpefulness

![image](https://precocityquboleout.blob.core.windows.net/images/Screen%20Shot%202018-01-25%20at%2012.35.30%20PM.png)

