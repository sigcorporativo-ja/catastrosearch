import namespace from 'mapea-util/decorator';

@namespace("M.impl.control")
export class CatastroSearchControl extends M.impl.Control {
  /**
   * @classdesc
   * Main constructor of the CatastroSearchControl.
   *
   * @constructor
   * @extends {M.impl.Control}
   * @api stable
   */
  constructor() {
    super();
    this.layer_ = new M.layer.Vector({
      'name': 'Catastro_Coordinates'
    }, {
        'displayInLayerSwitcher': false
      });
  }
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    this.facadeMap_ = map;
    this.element = html;
    // Annadimos la capa vectorial al mapa
    map.addLayers(this.layer_);

    var olMap = map.getMapImpl();
    ol.control.Control.call(this, {
      'element': html,
      'target': null
    });
    olMap.addControl(this);
  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  activate() {

  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {

  }

  /**
   *
   *
   * @param {any} longitude
   * @param {any} latitude
   * @returns
   * @memberof CatastroSearchControl
   */
  addCoordToMap(longitude, latitude, selectedProjection) {
    let coordinates = ol.proj.transform([longitude, latitude], selectedProjection, this.facadeMap_.getProjection().code);
    let feature = new M.Feature(null, {
      geometry: {
        coordinates: coordinates,
        type: 'Point'
      }
    });
    this.layer_.addFeatures(feature);
    return this.layer_;

  }


  /**
   *
   *
   * @param {any} features
   * @memberof CatastroSearchControl
   */
  centerLayer() {
    let extent = this.layer_.getFeaturesExtent();
    if (!M.utils.isNullOrEmpty(extent)) {
      this.facadeMap_.getMapImpl().getView().fit(extent, { duration: 500, minResolution: 1 });
    }
  }

  clearCoordinatesLayer() {
    this.layer_.clear();
  }
}
