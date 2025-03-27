import express from 'express';
import {
  createTeamLeader,
  deleteTeamLeader,
  getAllTeamLeaders,
  updateTeamLeader,
} from '../controllers/teamLeader.controller.js';

const teamLeaderRouter = express.Router();

teamLeaderRouter.route('/').get(getAllTeamLeaders).post(createTeamLeader);

teamLeaderRouter.route('/:id').put(updateTeamLeader).delete(deleteTeamLeader);

export default teamLeaderRouter;
