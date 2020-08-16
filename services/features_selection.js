const timer = require('perf_hooks').performance;
const { io } = require('../app.js');

const naive_bayes = require('./naive_bayes.js');
const features_extraction = require('./features_extraction.js');
const dataset = require('./dataset.js');
const performance_measure = require('./performance_measure.js');
const LocalOptimum = require('../models/LocalOptimum.js');
const timeUtils = require('../utils/time.js');

/**
 * * Doing features selection and save its results into database
 * @param {number} totalPopulation
 * ? integer number
 * @param {number} totalIndividu
 * ? integer number
 * @param {number} crossoverRate
 * ? float number
 * @param {number} mutationRate
 * ? float number
 * @return {object}
 */
const generateAndWrite = async (
  totalPopulation,
  totalIndividu,
  crossoverRate,
  mutationRate,
) => {
  try {
    const totalParents = Math.floor(totalIndividu / 2);

    // fetch data
    const [
      testingSets,
      testingSetsTfIdfs,
      priors,
      classificationModels,
      tfIdfModels,
      performance,
    ] = await Promise.all([
      dataset.readDatasetsWhere({ type: 'testing set' }),
      features_extraction.readTfIdfsFrom('testing set'),
      naive_bayes.readPriorsWhere({ fold_number: 0 }),
      naive_bayes.readClassificationModelsWhere({ fold_number: 0 }),
      naive_bayes.readTfIdfModelsWhere({ fold_number: 0 }),
      performance_measure.readPerformanceMeasureWhere({ fold_number: 0 }),
      deleteLocalOptimumsWhere({}),
    ]);

    // error handling
    if (!testingSets.length) return { errorLevel: 1 };
    if (!testingSetsTfIdfs.length) return { errorLevel: 2 };
    if (!priors.length || !tfIdfModels.length || !classificationModels.length)
      return { errorLevel: 3 };

    // initializing containers
    const localOptimums = [];
    let parents = [];
    let offsprings = [];

    // algorithm optimization
    const tokensInModel = tfIdfModels.map((model) => model.term);
    const mappedTfIdfModels = {};
    for (const model of tfIdfModels) {
      mappedTfIdfModels[model.term] = model;
    }

    const classificationModelClone = classificationModels.map((model) => {
      return {
        _id: model._id,
        label: model.label,
        means: new Map(),
        stdevs: new Map(),
        fold_number: model.fold_number,
      };
    });

    // the process of genetic evolution
    for (
      let populationIndex = 0;
      populationIndex < totalPopulation;
      populationIndex++
    ) {
      // choromosomes initialization
      const chromosomes = initialization(
        totalIndividu,
        offsprings,
        tokensInModel,
      );

      // fitness assignment
      const population = await fitnessAssignment(
        chromosomes,
        tokensInModel,
        testingSets,
        testingSetsTfIdfs,
        priors,
        mappedTfIdfModels,
        classificationModels,
        classificationModelClone,
      );

      // get local optimum
      const localOptimum = {
        generation_number: populationIndex + 1,
        ...getLocalOptimum(population),
        is_best: false,
      };

      // socket.io emit to client
      io.emit('local optimum resolved', localOptimum);

      // save population and local optimum state
      localOptimums.push(localOptimum);

      // selection
      parents = selection(population, parents, totalParents);

      // crossover
      offsprings = crossover(crossoverRate, parents, totalParents);

      // mutation
      offsprings = mutation(mutationRate, offsprings);
    }

    // save local optimums into database
    await createLocalOptimums(localOptimums).catch((error) =>
      console.error(error),
    );

    // determine best individual ever
    const bestIndividualEver = getBestIndividualEver(localOptimums);
    await updateLocalOptimumWhere(
      { generation_number: bestIndividualEver.generation_number },
      { is_best: true },
    );

    // compare performance results
    const accuracyDifference = Math.abs(
      parseFloat(bestIndividualEver.fitness) -
        parseFloat(performance.overall_accuracy),
    );
    const totalFeaturesDifference = Math.abs(
      bestIndividualEver.selected_features.length - tfIdfModels.length,
    );
    const timeDifference = timeUtils.parse(
      Math.abs(
        bestIndividualEver.testing_execution_time -
          performance.testing_execution_time,
      ),
    );

    return {
      bestGenerationNumber: bestIndividualEver.generation_number,
      bestIndividuNumber: bestIndividualEver.individu_number,
      originalData: {
        accuracy: parseFloat(performance.overall_accuracy),
        totalFeatures: tfIdfModels.length,
        testing_execution_time: performance.testing_execution_time,
        executionTimeString: timeUtils.parse(
          performance.testing_execution_time,
        ),
      },
      newData: {
        accuracy: parseFloat(bestIndividualEver.fitness),
        totalFeatures: bestIndividualEver.selected_features.length,
        testing_execution_time: bestIndividualEver.testing_execution_time,
        executionTimeString: timeUtils.parse(
          bestIndividualEver.testing_execution_time,
        ),
      },
      comparisonResult: {
        accuracy: accuracyDifference,
        totalFeatures: totalFeaturesDifference,
        executionTimeString: timeDifference,
      },
    };
  } catch (error) {
    console.error(error);
  }
};

/**
 * * Get best individual ever among local optimums
 * @param {[object]} localOptimums
 * @return {object}
 */
const getBestIndividualEver = (localOptimums) => {
  // get highest fitness
  const highestFitness = Math.max(
    ...localOptimums.map((localOptimum) => localOptimum.fitness),
  );

  // get local optimums with highest fitness
  const localOptimumHavingHighestFitness = localOptimums.filter(
    (localOptimum) => localOptimum.fitness === highestFitness,
  );

  // get minimum number of features
  const minimumNumberOfFeatures = Math.min(
    ...localOptimumHavingHighestFitness.map(
      (localOptimum) => localOptimum.selected_features.length,
    ),
  );

  // get best individual ever
  const bestIndividualEver = localOptimumHavingHighestFitness.find(
    (localOptimum) =>
      localOptimum.selected_features.length === minimumNumberOfFeatures,
  );

  return bestIndividualEver;
};

/**
 * * Initializing chromosome of each individual in a population
 * @param {number} totalIndividu
 * ? integer number
 * @param {[[number]]} offsprings
 * ? integer number enum [1, 0]
 * @param {[string]} tokensInModel
 * @return {[[object]]}
 */
const initialization = (totalIndividu, offsprings, tokensInModel) => {
  // initializing chromosomes
  const chromosomes = [];

  for (let individuIndex = 0; individuIndex < totalIndividu; individuIndex++) {
    // initialize (binary) allele
    const chromosome = Object.keys(tokensInModel).map((tokenIndex) =>
      offsprings.length === 0
        ? Math.round(Math.random())
        : offsprings[individuIndex][tokenIndex],
    );
    // push chromosome of individual into chromosomes
    chromosomes.push(chromosome);
  }

  return chromosomes;
};

/**
 * * Doing fitness assignment for each individual in a population
 * @param {[[number]]} chromosomes
 * ? integer number enum [1, 0]
 * @param {[string]} tokensInModel
 * @param {[object]} testingSets
 * @param {[object]} testingSetsTfIdfs
 * @param {[object]} priors
 * @param {object} mappedTfIdfModels
 * @param {[object]} classificationModels
 * @param {[object]} classificationModelClone
 * @return {[object]}
 */
const fitnessAssignment = async (
  chromosomes,
  tokensInModel,
  testingSets,
  testingSetsTfIdfs,
  priors,
  mappedTfIdfModels,
  classificationModels,
  classificationModelClone,
) => {
  // initialize population
  const population = [];

  for (const [index, chromosome] of chromosomes.entries()) {
    // transform gene into token when allele is 1
    const pickedFeatures = Object.keys(chromosome)
      .filter((gene) => chromosome[gene] === 1)
      .map((gene) => tokensInModel[gene]);

    // filter models
    const reducedClassificationModels = [...classificationModelClone];
    const reducedTfIdfModels = [];
    for (const term of pickedFeatures) {
      if (mappedTfIdfModels[term]) {
        for (const [index, model] of reducedClassificationModels.entries()) {
          model.means.set(term, classificationModels[index].means.get(term));
          model.stdevs.set(term, classificationModels[index].stdevs.get(term));
        }
        reducedTfIdfModels.push(mappedTfIdfModels[term]);
      }
    }

    // set start testing time
    const timeStart = timer.now();

    // testing process
    const { classificationResults } = naive_bayes.testing(
      reducedTfIdfModels,
      reducedClassificationModels,
      priors,
      testingSets,
      testingSetsTfIdfs,
    );

    // set finish testing time
    const timeFinish = timer.now();

    // performance measurement
    const { performance } = await performance_measure.generate(
      classificationResults,
    );

    // assign individual data into population
    population.push({
      individu_number: index + 1,
      chromosome,
      selected_features: pickedFeatures,
      fitness: performance.overall_accuracy,
      testing_execution_time: timeFinish - timeStart,
      accuracies: performance.accuracies,
      recalls: performance.recalls,
      avg_recall: performance.avg_recall,
      precisions: performance.precisions,
      avg_precision: performance.avg_precision,
      f1_scores: performance.f1_scores,
      avg_f1_score: performance.avg_f1_score,
    });
  }

  return population;
};

/**
 * * Get local optimum among all individuals in a population
 * @param {[object]} population
 * @return {object}
 */
const getLocalOptimum = (population) => {
  // get individuals with highest fitness
  const highestAccuracy = Math.max(...population.map((data) => data.fitness));
  const individualsWithHighestFitness = population.filter(
    (data) => data.fitness === highestAccuracy,
  );

  // get optimum individual with highest accuracy and fewest features
  const fewestFeatures = Math.min(
    ...individualsWithHighestFitness.map(
      (data) => data.selected_features.length,
    ),
  );
  const localOptimum = individualsWithHighestFitness.find(
    (data) => data.selected_features.length === fewestFeatures,
  );

  return localOptimum;
};

/**
 * * Select some individuals as parent candidates with roullete wheel selection method
 * @param {[object]} population
 * @param {[object]} parents
 * @param {number} totalParents
 * ? integer number
 * @return {[object]}
 */
const selection = (population, parents, totalParents) => {
  const parentsForNextGeneration = [...population, ...parents]
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, totalParents)
    .map((individual) => {
      return { chromosome: individual.chromosome, fitness: individual.fitness };
    });

  return parentsForNextGeneration;
};

/**
 * * Crossover every pair of parents in a population
 * @param {number} crossoverRate
 * ? float number
 * @param {[object]} parents
 * @param {number} totalParents
 * ? integer number
 * @return {[[number]]}
 * ? integer number enum [1, 0]
 */
const crossover = (crossoverRate, parents, totalParents) => {
  const offsprings = [];
  for (let i = 0; i < totalParents; i++) {
    // assign base chromosome from each parent
    const offspring1 = [...parents[i].chromosome];
    const offspring2 = [
      ...parents[i < totalParents - 1 ? i + 1 : 0].chromosome,
    ];

    // crossover
    for (let j = 0; j < offspring1.length; j++) {
      if (Math.random() <= crossoverRate) {
        [offspring1[j], offspring2[j]] = [offspring2[j], offspring1[j]];
      }
    }

    // assign offsprings with generated chromosome
    offsprings.push(offspring1, offspring2);
  }

  return offsprings;
};

/**
 * * Doing mutation experiment for each allele in every offspring
 * @param {number} mutationRate
 * ? float number
 * @param {[[number]]} offsprings
 * ? integer number enum [1, 0]
 * @return {[[number]]}
 * ? integer number enum [1, 0]
 */
const mutation = (mutationRate, offsprings) => {
  const mutatedOffsprings = offsprings.map((offspring) =>
    offspring.map((allele) => {
      if (Math.random() <= mutationRate) {
        return allele === 0 ? 1 : 0;
      } else {
        return allele;
      }
    }),
  );

  return mutatedOffsprings;
};

/**
 * * Get a local optimum corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const readLocalOptimumWhere = async (filter) => {
  const localOptimum = await LocalOptimum.findOne(filter).catch((error) =>
    console.error(error),
  );
  return localOptimum;
};

/**
 * * Get many local optimums corresponding to the filter
 * @param {object} filter
 * @return {[object]}
 */
const readLocalOptimumsWhere = async (filter) => {
  const localOptimums = await LocalOptimum.find(filter)
    .sort({ generation_number: 'asc' })
    .catch((error) => console.error(error));
  return localOptimums;
};

/**
 * * Save many local optimums into database
 * @param {[object]} localOptimums
 * @return {[object]}
 */
const createLocalOptimums = async (localOptimums) => {
  const createdLocalOptimums = await LocalOptimum.insertMany(localOptimums, {
    ordered: false,
    lean: true,
  }).catch((error) => console.error(error));
  return createdLocalOptimums;
};

/**
 * * Update a local optimum corresponding to the filter
 * @param {object} filter
 * @return {object}
 */
const updateLocalOptimumWhere = async (filter, object) => {
  const updatedLocalOptimums = await LocalOptimum.updateOne(
    filter,
    object,
  ).catch((error) => console.error(error));
  return updatedLocalOptimums;
};

/**
 * * Delete many local optimums corresponding to the filter
 * @param {object} filter
 * @return {Query}
 */
const deleteLocalOptimumsWhere = async (filter) => {
  const response = await LocalOptimum.deleteMany(filter).catch((error) =>
    console.error(error),
  );
  return response;
};

module.exports = {
  generateAndWrite,
  readLocalOptimumWhere,
  readLocalOptimumsWhere,
  deleteLocalOptimumsWhere,
};
