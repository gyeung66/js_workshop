// tf.js

function getSeedData() {
  const dataByClass = [
    [],
    [],
    []
  ];
  const targetsByClass = [
    [],
    [],
    []
  ];
  for (const seed of seedData) {
    const seedClass = seed[seed.length - 1];
    const data = seed.slice(0, seed.length -1);
    dataByClass[seedClass].push(data);
    targetsByClass[seedClass].push(seedClass);
  }
  const trainingXs = [];
  const trainingYs = [];
  const testingXs = [];
  const testingYs = [];
  for (let i = 0; i < dataByClass.length; i++) {
    const [trainX, trainY, testX, testY] = convertToTensors(dataByClass[i], targetsByClass[i], 0.2);
    trainingXs.push(trainX);
    trainingYs.push(trainY);
    testingXs.push(testX);
    testingYs.push(testY);
  }

  return [
    tf.concat(trainingXs, 0), tf.concat(trainingYs, 0),
    tf.concat(testingXs, 0), tf.concat(testingYs, 0)
  ];
}

function convertToTensors(data, targets, split) {
  const numExamples = data.length;
  const numTestExamples = Math.round(numExamples * split);
  const numTrainExamples = numExamples - numTestExamples;
  const xDims = data[0].length;
  const xs = tf.tensor2d(data, [numExamples, xDims]);
  const ys = tf.oneHot(tf.tensor1d(targets).toInt(), 3);
  const xTrain = xs.slice([0,0], [numTrainExamples, xDims]);
  const xTest = xs.slice([numTrainExamples, 0], [numTestExamples, xDims]);
  const yTrain = ys.slice([0,0], [numTrainExamples, 3]);
  const yTest = ys.slice([0,0], [numTestExamples, 3]);
  return [xTrain, yTrain, xTest, yTest];
}

async function trainModel(xTrain, yTrain, xTest, yTest) {
  const model = tf.sequential();
  model.add(tf.layers.dense(
    {units: 7, activation: 'sigmoid', inputShape: [xTrain.shape[1]]} // Sigmoid activation function for all inputs will provide output between 0 and 1
  ));
  model.add(tf.layers.dense(
    {units: 3, activation: 'softmax'}
  ));
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  await model.fit(xTrain, yTrain, {
    epochs: 40,
    validationData: [xTest, yTest],
    callbacks: {
      onEpochEnd: async(epoch, logs) => {
        console.log(`Epoch: ${epoch}, Logs: ${logs.loss}`);
        await tf.nextFrame();
      }
    }
  });
  return model;
};
