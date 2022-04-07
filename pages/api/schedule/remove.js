import * as Schedule from '../../../models/schedule.model';

export default async function handler(req, res) {
  let members = [];

  if (req.method === 'POST') {
    members = await Schedule.remove(req.body);
  } else {
    return res.status(405);
  }

  return res.status(200).json(members);
}  