import sortBy from 'lodash.sortby';
import * as yup from 'yup';
import { differenceInHours, format } from 'date-fns';
import { docClient } from './awsConfig';

let cacheUpdated;
let _events = [];

const types = ['Core', 'Elective', 'HTT'];
const branches = [
  'Heritage',
  'Hobbies',
  'Life Skills',
  'Outdoor Skills',
  'Science/Tech',
  'Sports/Fitness',
  'Values',
];

const EventSchema = yup.object({
  date: yup.date(),
  name: yup.string(),
  branch: yup.string().oneOf(branches),
  type: yup.string().oneOf(types),
});

/**
 * Adds a new event to the schedule
 * @param {Obejct} formData Form data contianing the new item
 * @returns the updated schedule
 */
export async function add(formData) {
  const item = { ...formData };

  // validate the new event
  try {
    await EventSchema.validate(item);
  } catch (err) {
    console.error(err);
  }

  // put the new event in the DB
  try {
    await docClient.put({ TableName: 'events', Item: item }).promise();
  } catch (err) {
    console.error("Unable to add new event.", item, err);
  }

  // return the updated schedule
  const schedule = await getAll(true);

  return schedule;
}

export async function getAll() {
  // re-up the cache only every 12 hours
  if (!cacheUpdated || differenceInHours(cacheUpdated, new Date()) > 12) {
    try {
      // fetch the members data
      const results = await docClient.scan({ TableName: 'events' }).promise();
      cacheUpdated = new Date();
      console.log("Events Cached", format(cacheUpdated, 'yyyy-MM-dd hh:mm:ss'));

      // cache the members
      _events = sortBy(results.Items, 'date');

    } catch (err) {
      console.error("Unable to fetch Events.", err);
    }
  }

  return _events;
}

/**
 * Deletes a event from the DB and returns the updated schedule
 * @param {String} name The name of the user to delete
 * @returns The new list of events
 */
export async function remove(item) {
  const { name, date } = item;

  // delete the event from the DB
  try {
    await docClient.delete({ TableName: 'events', Key: { name, date } }).promise();
  } catch (err) {
    console.error(`Unable to delete event. ${name}, ${date}`, err);
  }

  // return the updated schedule
  const schedule = await getAll(true);

  return schedule;
}

// const testEvents = [
//   {date: '3/10/2022', name: 'Personal Safety', branch: 'Life Skills', type: 'core'},
//   {date: '3/17/2022', name: 'Maps Skills', branch: 'Life Skills', type: 'elective'},
//   {date: '3/19/2022', name: 'Fire Station Tour', branch: 'Life Skills', type: 'htt'},
// ]

// testEvents.forEach((event) =>
//   docClient.put({ TableName: 'events', Item: event }, function(err, data) {
//       if (err) {
//           console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
//       } else {
//           console.log("PutItem succeeded:", JSON.stringify(data, null, 2));
//       }
//   }));
