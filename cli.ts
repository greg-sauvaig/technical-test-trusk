'use strict';

import readlineSync from 'readline-sync';
import chalk from 'chalk';

const Nothing = Symbol('nothing');
type Nothing = typeof Nothing;
export type Maybe<T> = T | Nothing;

let formIsValid: Boolean | String = false;

export function promptError() {
  console.log(chalk.white.bold('\r\nJe n\'ai pas compris votre résponse, veuillez recommencer\r\n'));
}

/**
 * validate user input as a non empty string value
 * 
 * @param {Maybe<String>} maybeString user input to validate 
 * 
 * @returns {Boolean} is valid not empty string
 */
export function validateNotEmptyString(maybeString: Maybe<String>): Boolean {
  return typeof maybeString === 'string' && isNaN(maybeString as unknown as number) && maybeString.toString().length > 0;
}

/**
 * validate user input as a valid strictly positive integer number string value
 * this function should only be used with a string as input
 * 
 * @param {Maybe<String>} maybeString user input to validate 
 * 
 * @returns {Boolean} is valid number string value
 */
export function validatePositiveIntNumberString(number: any): Boolean {
  return !isNaN(Number(number)) && isFinite(number) && number % 1 === 0 && parseInt(number, 10) > 0;
}

/**
 * prompt user the question to answer is trusk userName via command line
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruskUserName(): Maybe<String> {
  const userName = readlineSync.question('Veuillez saisir votre nom sur la platforme Trusk: ');
  return userName;
}

/**
 * prompt user the question to answer is trusk company via command line
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruskerCompanyName(): Maybe<String> {
  const companyName = readlineSync.question('Veuillez saisir le nom de votre société: ');
  return companyName;
}

/**
 * prompt user the question to answer the number of company employees
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruskerCompanyEmployeesNumber(): Maybe<String> {
  const number = readlineSync.question('Veuillez saisir le nombre d\'employés de votre société: ');
  return number;
}

/**
 * prompt user the question to answer the name of a company employee
 * 
 * @param {Number} employeeNumber number of the employee
 * 
 * @returns {Maybe<String>} user response
 */
function askEmployeeName(employeeNumber: Number): Maybe<String> {
  let employeeName: Maybe<String> = '';
  if (employeeNumber === 1) {
    employeeName = readlineSync.question(`Veuillez saisir le nom de votre ${employeeNumber} er/ère employé(e): `);
  } else {
    employeeName = readlineSync.question(`Veuillez saisir le nom de votre ${employeeNumber} ème employé(e): `);
  }
  return employeeName;
}

/**
 * prompt user the question to anwser the number of company truck(s)
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruskerCompanyTrucksNumber(): Maybe<String> {
  const number = readlineSync.question('Veuillez saisir le nombre de camions de votre société: ');
  return number;
}

/**
 * prompt user the question to anwser the number of cube meter of a truck
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruckVolume(truckNumber: Number): Maybe<String> {
  let truckVolume: Maybe<String> = '';
  if (truckNumber === 1) {
    truckVolume = readlineSync.question(`Veuillez saisir le volume en m3 de votre ${truckNumber} er camion: `);
  } else {
    truckVolume = readlineSync.question(`Veuillez saisir le volume en m3 de votre ${truckNumber} ème camion: `);
  }
  return truckVolume;
}

/**
 * validate the format of the user input as cube meter
 * 
 * @param {Number} number the number of the truck
 *  
 * @returns {Boolean} is valid cube number
 */
export function validateVolumeInCubeMeter(number: any): Boolean {
  return ((!isNaN(parseFloat(number)) && parseFloat(number) > 0) || parseInt(number, 10) > 0) && isFinite(number);
}

/**
 * prompt user the question to answer the type of truck
 * 
 * @returns {Maybe<String>} user response
 */
export function askTruckType(): Maybe<String> {
  const truckType = readlineSync.question('Veuillez saisir le type de camion de votre société: ');
  return truckType;
}


/**
 * onboarding form, ask user question about his company
 * 
 * @returns {Boolean} the form is valid
 */
function onboardingForm(): Boolean {
  let truskUsername: Maybe<String> = '';
  let companyName: Maybe<String> = '';
  let companyEmployeeNumber: Maybe<String> = '';
  const employeesNames: String[] = [];
  let companyTrucksNumber: Maybe<String> = '';
  const trucksVolume: Number[] = [];
  let typeOfTruck: Maybe<String> = '';
  console.clear();
  console.log(chalk.white.bold('Bonjour, \r\nbienvenu(e) dans l\'utilitaire de configuration de votre compte trusk \r\n'));
  let first: Boolean = true;
  do {
    if (!first) {
      promptError();
    }
    truskUsername = askTruskUserName();
    first = false;
  } while (
    !validateNotEmptyString(truskUsername)
  )
  first = true;
  do {
    if (!first) {
      promptError();
    }
    companyName = askTruskerCompanyName();
    first = false;
  } while (
    !validateNotEmptyString(companyName)
  )
  first = true;
  do {
    if (!first) {
      promptError();
    }
    companyEmployeeNumber = askTruskerCompanyEmployeesNumber();
    first = false;
  } while (
    !validatePositiveIntNumberString(companyEmployeeNumber)
  )
  const companyEmployeeNumberAsNumber = parseInt(companyEmployeeNumber.toString(), 10);
  first = true;
  /**
   * prompt user the question to answer the name of all his employees
   * 
   * @param {Number} employeeNumber the number of the employee
   */
  function askAllEmployeesName(employeeNumber: Number): void {
    let companyEmployeeName: Maybe<String> = '';
    do {
      if (!first) {
        promptError();
      }
      companyEmployeeName = askEmployeeName(employeeNumber);
      first = false;
    } while (
      !validateNotEmptyString(companyEmployeeName)
    )
    employeesNames.push(companyEmployeeName.toString());
    first = true;
  }
  for (let index = 1; index <= companyEmployeeNumberAsNumber; index++) {
    askAllEmployeesName(index);
  }
  do {
    if (!first) {
      promptError();
    }
    companyTrucksNumber = askTruskerCompanyTrucksNumber();
    first = false;
  } while (
    !validatePositiveIntNumberString(companyTrucksNumber)
  )
  const companyTrucksNumberAsNumber = parseInt(companyTrucksNumber.toString(), 10);
  first = true;
  /**
   * prompt user the question to answer volume of each truck
   *
   * @param {Number} truckNumber the truck number
   */
  function askAllTrucksVolume(truckNumber: Number): void {
    let companyTruckVolume: Maybe<String> = '';
    do {
      if (!first) {
        promptError();
      }
      companyTruckVolume = askTruckVolume(truckNumber);
      first = false;
    } while (
      !validateVolumeInCubeMeter(companyTruckVolume)
    )
    trucksVolume.push(new Number(companyTruckVolume));
    first = true;
  }
  for (let index = 1; index <= companyTrucksNumberAsNumber; index++) {
    askAllTrucksVolume(index);
  }
  do {
    if (!first) {
      promptError();
    }
    typeOfTruck = askTruckType();
    first = false;
  } while (
    !validateNotEmptyString(typeOfTruck)
  )
  first = true;
  console.clear();
  console.log(chalk.white.bold('Récapitulons\r\n'))
  console.log(`Votre nom est: ${truskUsername.toString()}`);
  console.log(`Le nom de votre société est ${companyName.toString()}`);
  console.log(`Votre société comporte ${companyEmployeeNumber.toString()} employé(e)${companyEmployeeNumberAsNumber > 1 ? 's' : ''}`);
  console.log(`${companyEmployeeNumberAsNumber > 1 ? 'Vos' : 'Votre'} employé(e)${companyEmployeeNumberAsNumber > 1 ? 's' : ''} ${companyEmployeeNumberAsNumber > 1 ? 'sont' : 'est'}:`);
  for (const employee of employeesNames) {
    console.log(`- ${employee}`);
  }
  console.log(`Votre entreprise dispose de ${companyTrucksNumber.toString()} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''}`);
  console.log(`Le volume de ${companyTrucksNumber as unknown as number > 1 ? 'vos': 'votre'} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''} est:`);
  for (const volume of trucksVolume) {
    console.log(`- ${volume.toString()} m3`);
  }
  console.log(`Le type de ${companyTrucksNumber as unknown as number > 1 ? 'vos': 'votre'} camion${companyTrucksNumber as unknown as number > 1 ? 's': ''} est ${typeOfTruck.toString()}`);
  formIsValid = readlineSync.question(
    'Les informations sont elles valides? '+chalk.white.bold('(oui/non) '),
    {
      trueValue: ['oui', 'o'],
      falseValue: ['non', 'n']
    }
  );
  if ((formIsValid as unknown as Boolean) === true) {
    return true;
  } else if ((formIsValid  as unknown as Boolean) === false) {
    return false;
  } 
  return false;
}

/**
 * onboarding form runner
 * 
 * @returns {void}
 */
function run(): void {
  do {
    formIsValid = onboardingForm();
  } while (
    !formIsValid
  )
}

export default run;
