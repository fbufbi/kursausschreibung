import Route from '@ember/routing/route';
import uikit from 'uikit';

export default Route.extend({
  model(params) {
    let eventsByArea = this.modelFor('application');

    // check if area of education exists
    if (!eventsByArea.areas.hasOwnProperty(params.area_of_education)) {
      this.replaceWith('/');
      return;
    }

    return eventsByArea.areas[params.area_of_education];
  },

  actions: {
    didTransition() {
      let modal = uikit.modal('#menu-modal');

      if (modal !== undefined) {
        modal.hide();
      }
    }
  }
});
