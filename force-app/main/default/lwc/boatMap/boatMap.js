import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

import {
  APPLICATION_SCOPE,
  subscribe,
  MessageContext
} from 'lightning/messageService';

import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";

const LONGITUDE_FIELD = 'Boat__c.Geolocation__Longitude__s';
const LATITUDE_FIELD = 'Boat__c.Geolocation__Latitude__s';
const BOAT_FIELDS = [LONGITUDE_FIELD, LATITUDE_FIELD];

export default class BoatMap extends LightningElement {
  subscription = null;
  @api
  boatId;

  @api
  get recordId() {
    return this.boatId;
  }
  set recordId(value) {
    this.setAttribute('boatId', value);
    this.boatId = value;
  }

  get showMap() {
    return this.mapMarkers.length > 0;
  }

  error = undefined;
  mapMarkers = [];

  @wire(MessageContext)
  messageContext;

  @wire(getRecord, { recordId: '$boatId', fields: BOAT_FIELDS })
  wiredRecord({ error, data }) {
    if (data) {
      this.error = undefined;
      const longitude = data.fields.Geolocation__Longitude__s.value;
      const latitude = data.fields.Geolocation__Latitude__s.value;
      this.updateMap(longitude, latitude);
    } else if (error) {
      this.error = error;
      this.boatId = undefined;
      this.mapMarkers = [];
    }
  }

  connectedCallback() {
    // recordId is populated on Record Pages, and this component
    // should not update when this component is on a record page.
    if (this.subscription || this.recordId) {
      return;
    }
    // Subscribe to the message channel to retrieve the recordID and assign it to boatId.
    this.subscribeMC();
  }

  subscribeMC() {
    this.subscription = subscribe(
      this.messageContext, BOATMC, (message) => {
        this.boatId = message.recordId
      }, {
      scope: APPLICATION_SCOPE
    });
  }

  handleMessage(message) {
    this.recordId = message.recordId;
  }

  updateMap(Longitude, Latitude) {
    this.mapMarkers = [{
      location: {
        Latitude,
        Longitude
      }
    }];
  }

}