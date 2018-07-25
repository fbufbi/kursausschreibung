import Component from '@ember/component';
import storage from 'kursausschreibung/framework/storage';
import { getString } from 'kursausschreibung/framework/translate';
import moment from 'moment';

export default Component.extend({
  actions: {
    submit(event) {
      event.preventDefault();

      subscribe(this.$('form'), this);
      this.get('subscribe')();
    }
  }
});

// this function subscribes a person to an event using the information
// provided in the form
// TODO: consider moving this into api.js or a new framework file
function subscribe(form, self) {
  let useCompanyAddress = self.get('useCompanyAddress') === true;
  let eventId = self.get('eventId');

  // main address
  let addressProperties = [
    'Country', 'CountryId', 'FormOfAddress', 'FormOfAddressId', 'HomeCountry', 'HomeCountryId',
    'Nationality', 'NationalityId', 'AddressLine1', 'AddressLine2', 'BillingAddress',
    'Birthdate', 'CorrespondenceAddress', 'Email', 'Email2', 'FirstName', 'Gender', 'HomeTown',
    'IsEmployee', 'LastName', 'Location', 'MiddleName', 'NativeLanguage', 'PhoneMobile', 'PhonePrivate',
    'Profession', 'SocialSecurityNumber', 'StayPermit', 'StayPermitExpiry', 'Zip'
  ];

  let addressData = getFieldSetData(form, addressProperties, '.address-fields');

  let companyAddressProperties = [
    'PersonId', 'AddressType', 'AddressTypeId', 'Country', 'CountryId', 'FormOfAddress', 'FormOfAddressId',
    'AddressLine1', 'AddressLine2', 'Company', 'Department', 'FirstName', 'IsBilling', 'IsCorrespondence',
    'LastName', 'Location', 'Remark', 'ValidFrom', 'ValidTo', 'Zip'
  ];

  // company address
  let companyAddressData = getFieldSetData(form, companyAddressProperties, '.company-address-fields');

  // subscription
  let subscriptionData = {
    EventId: eventId,
    PersonId: null,
    SubscriptionDetails: []
  };

  let assocSubscriptionData = getFieldSetData(form, [], '.subscription-detail-fields'); // for confirmation values

  form.find('.subscription-detail-fields').find('input, select').each((_, element) => {
    let vssId = parseInt(element.name);
    let value = null;

    if (element.type === 'checkbox')
      value = element.checked ? 'Ja' : 'Nein';
    else if (element.value !== '' && element.type === 'date')
      value = moment(element.value).format('DD.MM.YYYY');
    else if ((element.value !== '' && element.type !== 'radio') || element.checked)
      value = element.value;

    if (value !== null)
      subscriptionData.SubscriptionDetails.push({ VssId: vssId, Value: value });
  });

  // get the values for the confirmation table
  let tableData = {
    fields: getTableData(self.get('fields'), addressData),
    subscriptionDetailFields: getTableData(self.get('subscriptionDetailFields'), assocSubscriptionData)
  };

  if (useCompanyAddress)
    tableData.companyFields = getTableData(self.get('companyFields'), companyAddressData);

  // save the data to submit
  let dataToSubmit = {
    eventId, useCompanyAddress, addressData, companyAddressData, subscriptionData, tableData
  };

  storage.localStoreItem('kursausschreibung.dataToSubmit', dataToSubmit);
}

// get data from a field set which is ready to get posted to Persons/Addresses
function getFieldSetData(form, properties, selector) {
  let data = {};

  for (let property of properties) {
    data[property] = null;
  }

  form.find(selector).find('input, select').each((_, element) => setProperties(data, element));

  return data;
}

// sets one or two properties on data depending
// on wethere element is a select-node
function setProperties(data, element) {
  if (element.nodeName === 'SELECT') {
    data[element.name] = element.options[element.selectedIndex].text;
    data[element.name + 'Id'] = parseInt(element.value);
    return;
  }

  if (element.type === 'radio') {
    if (element.checked) {
      data[element.name] = element.dataset.humanReadable;
      data[element.name + 'Id'] = parseInt(element.value);
    }
    return;
  }

  if (element.type === 'checkbox') {
    data[element.name] = element.checked;
    return;
  }

  data[element.name] = element.value === '' ? null : element.value;
}

// return a list of key-value pairs for the confirmation table
function getTableData(fields, data) {
  return fields
    .map(field => {
      let label = field.label;
      let value = data[field.id];

      // skip empty values
      if (value === null || value === '' || value === undefined)
        return null;

      // localize true/false
      if (field.dataType === 'checkbox')
        value = getString(value ? 'yes' : 'no');

      // localize dates
      if (field.dataType === 'date')
        value = moment(value).format('LL');

      return { label, value };
    }).filter(field => field !== null);
}