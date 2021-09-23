'use strict';

import redis from 'redis';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { Maybe, validateNotEmptyString, validatePositiveIntNumberString, validateVolumeInCubeMeter } from './cli';
import chalk from 'chalk';

/**
 * utility function to get functionnal redis client
 * 
 * @returns redisClient
 */
function getClient() {
  return redis.createClient(
    6379, 
    'localhost',
    {
      host: 'localhost',
      port: 6379,
      retry_strategy: function (options: any) {
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 20) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    }
  );
}

// set up redis client
const client = getClient();
const sendCommand = promisify(client.sendCommand).bind(client);

/**
 * redis read utility wrapper to read single value
 * 
 * @param {String} key the redis key where the data is stored
 * 
 * @returns {Promise<Maybe<string | number>>} the redis stored value
 */
async function read(key: String): Promise<Maybe<string | number>> {
  return sendCommand('GET', [key]); 
}

/**
 * redis write utility wrapper to write single value
 * 
 * @param {String} key the redis key where the data is stored
 * @param {String} value the value to store
 *  
 * @returns {Promise<String>} the redis write return value
 */
async function write(key: String, value: String): Promise<String> {
  return sendCommand('SET', [key, value]); 
}

/**
 * redis read list utility wrapper to read list value
 * 
 * @param {String} key the redis list key where the data is stored
 * @param {number} start the start of the redis list slice desired
 * @param {number} end the end of the data slice
 * 
 * @returns {Promise<String[] | String | number | Number | Number[] | number[]>} the stored value
 */
async function readList(key: String, start: number = 0, end: number = -1): Promise<String[] | String | number | Number | Number[] | number[]>  {
  return sendCommand('LRANGE', [key, start, end]); 
}

/**
 * redis write list wrapper
 * 
 * @param {String} key the redis list key where the data is stored
 * @param {String} value the value to store at the end of the list
 *
 * @returns {Promise<String>} the redis write return value
 */
async function writeList(key: String, value: String): Promise<String>  {
  return sendCommand('RPUSH', [key, value]); 
}

/**
 * empty the redis instance
 * 
 * @returns {Promise<String>} redis flush operation response 
 */
async function flushDB(): Promise<String>  {
  return sendCommand('FLUSHDB');
}

/**
 * read truskUserName from redis get default empty string if not found
 * 
 * @param {Maybe<string>} value used by inquirer
 * 
 * @returns {Promise<Maybe<string>>} redis value or default
 */
async function getTruskUsername(value: Maybe<string>): Promise<Maybe<string>> {
  value = await read('truskUsername') as string;
  return value || '';
}

/**
 * read companyName from redis get default empty string if not found
 * 
 * @param {Maybe<string>} value used by inquirer
 * 
 * @returns {Promise<Maybe<string>>} redis value or default
 */
async function getTruskerCompanyName(value: Maybe<string>): Promise<Maybe<string>> {
  value = await read('companyName') as string;
  return value || '';
}

/**
 * read companyEmployeeNumber from redis get default zero if not found
 * 
 * @param {Maybe<number>} value used by inquirer
 * 
 * @returns {Promise<Maybe<number>>} redis value or default
 */
async function getTruskerCompanyEmployeeNumber(value: Maybe<number>): Promise<Maybe<number>> {
  value = await read('companyEmployeeNumber') as number;
  return value || 0;
}

/**
 * validate trusk user name string value and save it in redis if valid
 * 
 * @param {any} value
 * 
 * @returns {Promise<Boolean>} is valid
 */
async function validateNotEmptyStringAndSaveTruskUsername(value: any): Promise<Boolean> {
  const isValid = validateNotEmptyString(value);
  if (isValid) {
    await write('truskUsername', value);
  }
  return isValid;
}

/**
 * validate trusker company name string value and save it in redis if valid
 * 
 * @param {any} value
 * 
 * @returns {Promise<Boolean>} is valid
 */
async function validateNotEmptyStringAndSaveCompanyName(value: any): Promise<Boolean> {
  const isValid = validateNotEmptyString(value);
  if (isValid) {
    await write('companyName', value);
  }
  return isValid;
}

/**
 * validate employee company positive integer number value and save it in redis if valid
 * 
 * @param {any} value
 * 
 * @returns {Promise<Boolean>} is valid
 */
async function validatePositiveIntNumberStringAndSaveEmployeeNumber(value: any): Promise<Boolean> {
  const isValid = validatePositiveIntNumberString(value);
  if (isValid) {
    await write('companyEmployeeNumber', value);
  }
  return isValid;
}

/**
 * get trusker employee name by index position in redis storage list
 * 
 * @param {number} number employee number position
 * 
 * @returns {Promise<String>} the employee name stored in redis
 */
async function getTruskerCompanyEmployeeName(number: number): Promise<String> {
  const employeesName = await readList('employeesNames', number - 1 , 1) as String;
  return employeesName || '';
}

/**
 * validate trusker employee name string value and save it in redis if valid
 * 
 * @param {any} value
 * 
 * @returns {Promise<Boolean>} is valid
 */
async function validateNotEmptyStringAndSaveCompanyEmployeesName(value: any): Promise<boolean> {
  const isValid = validateNotEmptyString(value) as boolean;
  if (isValid) {
    await writeList('employeesNames', value);
  }
  return isValid;
}

/**
 * utility function to construct question string
 * 
 * @param {Number} employeeNumber use to construct pluralised sentence
 *  
 * @returns {string} the question to ask
 */
function askEmployeeName(employeeNumber: Number): string {
  if (employeeNumber === 1) {
    return `Veuillez saisir le nom de votre ${employeeNumber} er/ère employé(e): `;
  } 
  return `Veuillez saisir le nom de votre ${employeeNumber} ème employé(e): `;
}

/**
 * read company truck number from redis or zero
 * 
 * @param {Maybe<string>} value used by inquirer
 * 
 * @returns {Promise<Maybe<number>>} the truck number or zero
 */
async function getTruskerCompanyTrucksNumber(value: Maybe<number>): Promise<Maybe<number>> {
  value = await read('companyTrucksNumber') as number;
  return value || 0;
}

/**
 * validate and save truck number in redis if valid
 * 
 * @param {any} value the truck number input answer
 * 
 * @returns {Promise<boolean>} is valid
 */
async function validatePositiveIntNumberStringAndSaveTrucksNumber(value: any): Promise<boolean> {
  const isValid = validatePositiveIntNumberString(value) as boolean;
  if (isValid) {
    await write('companyTrucksNumber', value);
  }
  return isValid;
}

/**
 * utility function to get question string about volume of truck
 * 
 * @param {Number} truckNumber used to pluralize the question
 * 
 * @returns {string} the question
 */
function askTruckVolume(truckNumber: Number): string {
  if (truckNumber === 1) {
    return `Veuillez saisir le volume en m3 de votre ${truckNumber} er camion: `;
  }
  return `Veuillez saisir le volume en m3 de votre ${truckNumber} ème camion: `;
}

/**
 * read truck volume from redis or zero if not found
 * 
 * @param {number} number the volume of the truck
 * 
 * @returns {number} number the volume of the truck
 */
async function getTruckVolume(number: number): Promise<number> {
  const truckVolume = await readList('trucksVolume', number - 1 , 1) as number;
  return truckVolume || 0;
}

/**
 * validate truck volume and store it in redis if valid
 * 
 * @param {any} value truck volume reponse
 * 
 * @returns {Promise<boolean>} is valid
 */
async function validateVolumeInCubeMeterAndSaveTrucksVolume(value: any): Promise<boolean> {
  const isValid = validateVolumeInCubeMeter(value) as boolean;
  if (isValid) {
    await writeList('trucksVolume', value);
  }
  return isValid;
}

/**
 * read company truck type from redis or emtpy string if not found
 * 
 * @param value user by inquirer
 * 
 * @returns {Promise<string>} the company truck type or default empty string
 */
async function getTruskerCompanyTruckType(value: Maybe<string>): Promise<string> {
  value = await read('typeOfTruck') as string;
  return value || '';
}

/**
 * validate truck type and store it in redis if valid
 * 
 * @param {any} value truck volume reponse
 * 
 * @returns {Promise<boolean>} is valid
 */
async function validateNotEmptyStringAndSaveTruckType(value: any): Promise<boolean> {
  const isValid = validateNotEmptyString(value) as boolean;
  if (isValid) {
    await write('typeOfTruck', value);
  }
  return isValid;
}

/**
 * get inquirer question to ask employee names as many time as there is employees in the trusker company
 * 
 * @param {String[]} employeesName employees name list
 * @param {any} callback function to call after
 * 
 * @returns {void}
 */
function getEmployeesName(employeesName: String[], callback: any): void {
  inquirer.prompt(
    {
      type: 'input',
      name: 'employeesNames',
      message: askEmployeeName(employeesName.length + 1),
      default: getTruskerCompanyEmployeeName(employeesName.length + 1),
      validate: validateNotEmptyStringAndSaveCompanyEmployeesName,
      when: async (answer: any): Promise<boolean> => {
        const employeesNumber = await read('companyEmployeeNumber') as number;
        console.log('employeesNumber', employeesNumber, employeesName)
        if (employeesNumber <= employeesName.length) {
          for (const [index, value] of employeesName.entries()) {
            console.log(`${index + 1} employee name`, value);
          } 
        }
        return employeesName.length < Number(employeesNumber);
      },
      prefix: '',
      suffix: ''
    }
  ).then(
    async function (reply: String): Promise<any> {
      const employeesNumber = await read('companyEmployeeNumber');
      employeesName.push(reply);
      if (employeesName.length < Number(employeesNumber)) {
        return getEmployeesName(employeesName, callback);
      }
      return callback();
    } as any 
  );
};

// simple inquirer questions list
const questions = [
  {
    type: 'input',
    name: 'truskUsername',
    message: 'Veuillez saisir votre nom sur la platforme Trusk: ',
    default: getTruskUsername,
    validate: validateNotEmptyStringAndSaveTruskUsername,
    when: async (answer: any): Promise<Boolean> => {
      answer = await getTruskUsername(answer?.truskUsername);
      if (answer) {
        console.log(`Votre nom est: ${answer}`);
      }
      return !answer;
    },
    prefix: '',
    suffix: ''
  },
  {
    type: 'input',
    name: 'companyName',
    message: 'Veuillez saisir le nom de votre société: ',
    default: getTruskerCompanyName,
    validate: validateNotEmptyStringAndSaveCompanyName,
    when: async (answer: any): Promise<Boolean>  => {
      answer = await getTruskerCompanyName(answer?.companyName);
      if (answer) {
        console.log(`Le nom de votre société est ${answer}`);
      }
      return !answer;
    },
    prefix: '',
    suffix: ''
  },
  {
    type: 'number',
    name: 'companyEmployeeNumber',
    message: 'Veuillez saisir le nombre d\'employés de votre société: ',
    default: getTruskerCompanyEmployeeNumber,
    validate: validatePositiveIntNumberStringAndSaveEmployeeNumber,
    when: async (answer: any): Promise<Boolean>  => {
      answer = await getTruskerCompanyEmployeeNumber(answer?.companyEmployeeNumber);
      if (answer) {
        console.log('companyEmployeeNumber', answer);
      }
      return !answer;
    },
    prefix: '',
    suffix: ''
  },
];

/**
 * get inquirer question asking user to answer the number of truck in his company
 * it also call askTruckType if the user asnwer correctly
 * 
 * @returns {void}
 */
function getQuestionCompanyTrucksNumber(): void {
  inquirer
    .prompt({
      type: 'number',
      name: 'companyTrucksNumber',
      message: 'Veuillez saisir le nombre de camion de votre société: ',
      default: getTruskerCompanyTrucksNumber,
      validate: validatePositiveIntNumberStringAndSaveTrucksNumber,
      when: async (answer: any): Promise<boolean>  => {
        answer = await getTruskerCompanyTrucksNumber(answer?.companyTrucksNumber);
        if (answer) {
          console.log('companyTrucksNumber', answer);
        }
        return !answer;
      },
      prefix: '',
      suffix: ''
    }).then(async () => {
      getCompanyTrucksVolume(
        await readList('trucksVolume') as number[],
        () => askTruckType()
      );
    });
}

/**
 * get inquirer question asking user to answer the volume of each truck in his company
 * it also call getCompanyTrucksVolume if the user asnwer correctly
 * 
 * @param {number} trucksVolume use to identify and verify truck
 * @param {any} callback function to call after correct aswer
 * 
 * @returns {void}
 */
function getCompanyTrucksVolume(trucksVolume: number[], callback: any): void {
  inquirer.prompt(
    {
      type: 'number',
      name: 'trucksVolume',
      message: askTruckVolume(trucksVolume.length + 1),
      default: getTruckVolume(trucksVolume.length + 1),
      validate: validateVolumeInCubeMeterAndSaveTrucksVolume,
      when: async (answer: any): Promise<boolean> => {
        const truckNumber = await read('companyTrucksNumber') as number;
        if (trucksVolume.length >= truckNumber) {
          for (const [index, value] of trucksVolume.entries()) {
            console.log(`${index + 1} truck volume ${value} m3`);
          } 
        }
        return trucksVolume.length < truckNumber;
      },
      prefix: '',
      suffix: ''
    }
  ).then(
    async function (reply: number): Promise<any> {
      const truckNumber = await read('companyTrucksNumber');
      trucksVolume.push(reply);
      if (trucksVolume.length < Number(truckNumber)) {
        return getCompanyTrucksVolume(trucksVolume, callback);
      }
      return callback();
    } as any
  );
};

/**
 * get inquirer question asking user to answer the type of truck in his company
 * it also call askResumeValidation if the user asnwer correctly
 * 
 * @returns {void}
 */
function askTruckType(): void {
  inquirer
    .prompt({
      type: 'input',
      name: 'typeOfTruck',
      message: 'Veuillez saisir le type de camion de votre société: ',
      default: getTruskerCompanyTruckType,
      validate: validateNotEmptyStringAndSaveTruckType,
      when: async (answer: any): Promise<boolean>  => {
        answer = await getTruskerCompanyTruckType(answer?.typeOfTruck);
        if (answer) {
          console.log('typeOfTruck', answer);
        }
        return !answer;
      },
      prefix: '',
      suffix: ''
    }).then(async () => {
      askResumeValidation();
    });
}

/**
 * get inquirer question asking user to validate the onboarding resume he just answered
 * it restart the onboarding form if the user dont validate
 * it empty the redis datastorage if the user answer the question no matter the response
 * 
 * @returns {void}
 */
async function askResumeValidation() {
  console.clear();
  const truskUsername = await read('truskUsername') as string;
  const companyName = await read('companyName') as string;
  const companyEmployeeNumber = await read('companyEmployeeNumber') as number;
  const employeesNames = await readList('employeesNames') as string[];
  const companyTrucksNumber = await read('companyTrucksNumber') as number;
  const trucksVolume = await readList('trucksVolume') as number[];
  const typeOfTruck = await read('typeOfTruck') as string;
  let message = `Récapitulons
  Votre nom est: ${truskUsername}
  Le nom de votre société est ${companyName}
  Votre société comporte ${companyEmployeeNumber} employé(e)${companyEmployeeNumber > 1 ? 's' : ''}
  ${companyEmployeeNumber > 1 ? 'Vos' : 'Votre'} employé(e)${companyEmployeeNumber > 1 ? 's' : ''} ${companyEmployeeNumber > 1 ? 'sont' : 'est'}:`
  for (const employee of employeesNames) {
    message = `${message}
    - ${employee}`;
  }
  message = `${message}
  Votre entreprise dispose de ${companyTrucksNumber} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''}
  Le volume de ${companyTrucksNumber as unknown as number > 1 ? 'vos': 'votre'} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''} est:`;
  for (const volume of trucksVolume) {
    message = `${message}
    - ${volume} m3`;
  }
  message = `${message}
  Le type de ${companyTrucksNumber as unknown as number > 1 ? 'vos': 'votre'} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''} est ${typeOfTruck}
  
  Les informations sont elles valides? `;
  inquirer
    .prompt(
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: false,
        prefix: '',
        suffix: ''
      }
    )
    .then(async (reply: any) => {
      flushDB();
      if (!reply.confirm) {
        console.clear();
        return onboarding();
      }
      process.exit();
    });
}

/**
 * onboarding form caling function
 * 
 * @returns {void}
 */
function onboarding(): void {
  console.clear();
  console.log(chalk.white.bold('Bonjour, \r\nbienvenu(e) dans l\'utilitaire de configuration de votre compte trusk \r\n'));
  inquirer
    .prompt(questions)
    .then(async () => {
      getEmployeesName (
        await readList('employeesNames') as String[],
        () => getQuestionCompanyTrucksNumber()
      );
    });
}

onboarding();
