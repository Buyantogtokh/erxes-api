import { graphqlRequest } from '../db/connection';
import { pipelineLabelFactory } from '../db/factories';
import { PipelineLabels } from '../db/models';

import { BOARD_TYPES } from '../db/models/definitions/constants';
import './setup.ts';

describe('pipelineLabelQueries', () => {
  afterEach(async () => {
    // Clearing test data
    await PipelineLabels.deleteMany({});
  });

  test('Pipeline labels', async () => {
    const type = BOARD_TYPES.GROWTH_HACK;

    const args = { type };

    await pipelineLabelFactory({ type });
    await pipelineLabelFactory({ type });
    await pipelineLabelFactory({ type });

    const qry = `
      query pipelineLabels($type: String!) {
        pipelineLabels(type: $type) {
          _id
          name
          type
          colorCode
          pipelineId
        }
      }
    `;

    const response = await graphqlRequest(qry, 'pipelineLabels', args);

    expect(response.length).toBe(3);
  });

  test('Pipeline label detail', async () => {
    const qry = `
      query pipelineLabelDetail($_id: String!) {
        pipelineLabelDetail(_id: $_id) {
          _id
        }
      }
    `;

    const pipelineLabel = await pipelineLabelFactory();

    const response = await graphqlRequest(qry, 'pipelineLabelDetail', { _id: pipelineLabel._id });

    expect(response._id).toBe(pipelineLabel._id);
  });

  test('Pipeline label total count', async () => {
    await pipelineLabelFactory();
    await pipelineLabelFactory();
    await pipelineLabelFactory();
    await pipelineLabelFactory();

    const qry = `
      query pipelineLabelsTotalCount {
        pipelineLabelsTotalCount
      }
    `;

    const response = await graphqlRequest(qry, 'pipelineLabelsTotalCount');

    expect(response).toBe(4);
  });
});