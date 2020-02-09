import * as moment from 'moment';
import { graphqlRequest } from '../db/connection';
import {
  customerFactory,
  formFactory,
  formSubmissionFactory,
  integrationFactory,
  segmentFactory,
  tagsFactory,
} from '../db/factories';
import { Customers, FormSubmissions, Segments, Tags } from '../db/models';

import './setup.ts';

describe('customerQueries', () => {
  const commonParamDefs = `
    $page: Int,
    $perPage: Int,
    $segment: String,
    $tag: String,
    $ids: [String],
    $searchValue: String,
    $form: String,
    $startDate: String,
    $endDate: String,
    $lifecycleState: String,
    $leadStatus: String
  `;

  const commonParams = `
    page: $page
    perPage: $perPage
    segment: $segment
    tag: $tag
    ids: $ids
    searchValue: $searchValue
    form: $form
    startDate: $startDate
    endDate: $endDate
    lifecycleState: $lifecycleState
    leadStatus: $leadStatus
  `;

  const qryCustomers = `
    query customers(${commonParamDefs}) {
      customers(${commonParams}) {
        _id
      }
    }
  `;

  const qryCustomersMain = `
    query customersMain(${commonParamDefs}) {
      customersMain(${commonParams}) {
        list {
          _id
          firstName
          lastName
          primaryEmail
          primaryPhone
          tagIds
        }
        totalCount
      }
    }
  `;

  const qryCount = `
    query customerCounts(${commonParamDefs} $only: String) {
      customerCounts(${commonParams} only: $only)
    }
  `;

  afterEach(async () => {
    // Clearing test data
    await Customers.deleteMany({});
    await Segments.deleteMany({});
    await Tags.deleteMany({});
    await FormSubmissions.deleteMany({});
  });

  test('Customers', async () => {
    await graphqlRequest(qryCustomers, 'customers', {});
  });

  test('Customers filtered by ids', async () => {
    const customer1 = await customerFactory({}, true);
    const customer2 = await customerFactory({}, true);
    const customer3 = await customerFactory({}, true);

    await customerFactory({}, true);
    await customerFactory({}, true);
    await customerFactory({}, true);

    const ids = [customer1._id, customer2._id, customer3._id];

    await graphqlRequest(qryCustomers, 'customers', { ids });
  });

  test('Main customers', async () => {
    await graphqlRequest(qryCustomersMain, 'customersMain', {});
  });

  test('Count customers', async () => {
    const customer1 = await customerFactory({}, true);
    const customer2 = await customerFactory({}, true);
    const customer3 = await customerFactory({}, true);

    // Creating test data
    await segmentFactory({ contentType: 'customer' });

    const args = { only: 'bySegment', ids: [customer1._id, customer2._id, customer3._id] };

    await graphqlRequest(qryCount, 'customerCounts', args);
  });

  test('Count customers by segment', async () => {
    // Creating test data
    await segmentFactory({ contentType: 'customer' });

    const args = { only: 'bySegment' };

    await graphqlRequest(qryCount, 'customerCounts', args);
  });

  test('Customer count by tag', async () => {
    await tagsFactory({ type: 'company' });
    await tagsFactory({ type: 'customer' });

    await graphqlRequest(qryCount, 'customerCounts', {
      only: 'byTag',
    });
  });

  test('Customer count by form', async () => {
    await formFactory({});

    await graphqlRequest(qryCount, 'customerCounts', {
      only: 'byForm',
    });
  });

  test('Customer count by leadStatus', async () => {
    await graphqlRequest(qryCount, 'customerCounts', {
      only: 'byLeadStatus',
    });
  });

  test('Customer count by lifecycleState', async () => {
    await graphqlRequest(qryCount, 'customerCounts', {
      only: 'byLifecycleState',
    });
  });

  test('Customer count by IntegrationType', async () => {
    await integrationFactory({ kind: '' });

    await graphqlRequest(qryCount, 'customerCounts', {
      only: 'byIntegrationType',
    });
  });

  test('Customer filtered by submitted form', async () => {
    const customer1 = await customerFactory({}, true);
    const customer2 = await customerFactory({}, true);

    const form = await formFactory({});

    await formSubmissionFactory({ customerId: customer1._id, formId: form._id });
    await formSubmissionFactory({ customerId: customer2._id, formId: form._id });

    await graphqlRequest(qryCustomersMain, 'customersMain', {
      form: form._id,
    });
  });

  test('Customer filtered by submitted form with startDate and endDate', async () => {
    const customer = await customerFactory({}, true);
    const customer1 = await customerFactory({}, true);
    const customer2 = await customerFactory({}, true);

    const startDate = moment().format('YYYY-MM-DD HH:mm');
    const endDate = moment(startDate)
      .add(25, 'days')
      .format('YYYY-MM-DD HH:mm');

    const form = await formFactory();

    // Creating 3 submissions for form
    await formSubmissionFactory({ customerId: customer._id, formId: form._id });
    await formSubmissionFactory({ customerId: customer1._id, formId: form._id });
    await formSubmissionFactory({ customerId: customer2._id, formId: form._id });

    const args = {
      startDate,
      endDate,
      form: form._id,
    };

    await graphqlRequest(qryCustomersMain, 'customersMain', args);
  });

  test('Customer filtered by default selector', async () => {
    await integrationFactory({});

    await graphqlRequest(qryCustomersMain, 'customersMain', {});
  });

  test('Customer detail', async () => {
    const customer = await customerFactory({}, true);
    const customerWithCustomData = await customerFactory({});
    const customerNoMessengerData = await customerFactory();

    const qry = `
      query customerDetail($_id: String!) {
        customerDetail(_id: $_id) {
          _id
          createdAt
          modifiedAt
          integrationId
          firstName
          lastName
          primaryEmail
          emails
          primaryPhone
          phones
          isUser
          tagIds
          remoteAddress
          internalNotes
          location
          visitorContactInfo
          customFieldsData
          getTrackedData
          ownerId
          position
          department
          leadStatus
          lifecycleState
          hasAuthority
          description
          doNotDisturb
          links {
            linkedIn
            twitter
            facebook
            youtube
            github
            website
          }
          conversations { _id }
          getTags { _id }
          owner { _id }
          integration { _id }
          companies { _id }
        }
      }
    `;

    let response = await graphqlRequest(qry, 'customerDetail', {
      _id: customer._id,
    });

    expect(response._id).toBe(customer._id);

    response = await graphqlRequest(qry, 'customerDetail', {
      _id: customerWithCustomData._id,
    });

    expect(response._id).toBe(customerWithCustomData._id);

    response = await graphqlRequest(qry, 'customerDetail', {
      _id: customerNoMessengerData._id,
    });

    expect(response._id).toBe(customerNoMessengerData._id);
  });
});
