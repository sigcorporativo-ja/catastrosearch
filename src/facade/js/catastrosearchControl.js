import namespace from 'mapea-util/decorator';
import CatastroSearchImplControl from 'impl/catastrosearchControl';

@namespace("M.control")
export class CatastroSearchControl extends M.Control {

  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor() {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(M.impl.control.CatastroSearchControl)) {
      M.exception('La implementación usada no puede crear controles CatastroSearchControl');
    }
    // 2. implementation of this control
    let impl = new M.impl.control.CatastroSearchControl();
    super(impl, "CatastroSearch");

    // Inputs y variables de buscador por polígono y parcela
    this.inputParcel_ = null;
    this.inputPolygon_ = null;
    this.inputRC_ = null;
    this.selectMunicipality_ = null;
    this.selectProvince_ = null;
    // Inicio solo las provincias de Andalucia
    this.provincias_ = ["ALMERIA", "CADIZ", "CORDOBA", "GRANADA", "HUELVA", "JAEN", "MALAGA", "SEVILLA"];
  }

  /**
   *
   *
   * @param {any} html
   * @memberof CatastroSearchControl
   */
  addEvents(html) {
    // Registro los input y botones
    this.loadBtn_ = html.querySelector('.button > button.load');
    this.clearBtn_ = html.querySelector('.button > button.clear');
    this.selectProvince_ = html.querySelector('.form div.province > select');
    this.selectMunicipality_ = html.querySelector('.form div.municipality > select');
    this.inputParcel_ = html.querySelector('.form div.parcel > input');
    this.inputPolygon_ = html.querySelector('.form div.polygon > input');
    this.inputRC_ = html.querySelector('.form div.refcatastral > input');


    // Asigno las funciones a cada evento
    this.clearBtn_.addEventListener('click', (evt) => this.clearInputs());
    this.loadBtn_.addEventListener('click', (evt) => this.getRCFromPP());
    this.selectProvince_.addEventListener('change', (evt) => this.changeProvince(evt));
    this.selectMunicipality_.addEventListener('change', (evt) => this.changeMunicipality(evt));
    this.inputParcel_.addEventListener('input', (evt) => this.checkButtons(evt));
    this.inputPolygon_.addEventListener('input', (evt) => this.checkButtons(evt));
    this.inputRC_.addEventListener('input', (evt) => this.checkButtons(evt));

  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      M.template.compile('catastrosearch.html', {
        vars: {
          provincias: this.provincias_
        }
      }).then((html) => {
        //Establecer eventos
        this.addEvents(html);
        success(html);
      });
    });
  }

  /**
   * Habilita/Deshabilita los botones de carga y limpieza
   *
   * @memberof CatastroSearchControl
   */
  checkButtons(evt) {
    this.clearBtn_.disabled = (M.utils.isNullOrEmpty(this.selectProvince_.value) && M.utils.isNullOrEmpty(this.selectMunicipality_.value) &&
      M.utils.isNullOrEmpty(this.inputPolygon_.value) && M.utils.isNullOrEmpty(this.inputParcel_.value) && M.utils.isNullOrEmpty(this.inputRC_.value));
    this.loadBtn_.disabled = ((M.utils.isNullOrEmpty(this.selectProvince_.value) || M.utils.isNullOrEmpty(this.selectMunicipality_.value) ||
      M.utils.isNullOrEmpty(this.inputPolygon_.value) || M.utils.isNullOrEmpty(this.inputParcel_.value)) && M.utils.isNullOrEmpty(this.inputRC_.value));

    if (evt) {
      if (evt.target === this.inputRC_) {
        this.selectProvince_.value = this.selectMunicipality_.value =
          this.inputPolygon_.value =
          this.inputParcel_.value = "";
      } else { //if (evt.target === this.inputParcel_ || evt.target === this.inputPolygon_)
        this.inputRC_.value = '';
      }
    }
  }
  /**
   * Elimina los valores de los inputs y limpio la capa de features
   *
   * @memberof CatastroSearchControl
   */
  clearInputs() {

    this.inputPolygon_.value = '';
    this.inputParcel_.value = '';
    this.selectProvince_.value = '';
    this.inputRC_.value = '';
    this.selectMunicipality_.value = '';
    this.checkButtons();
    //Limpia la capa de coordenadas
    this.getImpl().clearCoordinatesLayer();
  }

  changeProvince(evt) {
    this.checkButtons(evt);
    this.getMunicipios();
  }

  changeMunicipality(evt) {
    this.checkButtons(evt);
  }

  /**
   *
   *
   * @memberof CatastroSearchControl
   */
  getMunicipios() {
    let municipiosURL = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaMunicipio";
    M.remote.get(municipiosURL, {
      Provincia: this.selectProvince_.value,
      Municipio: ''
    }, {
      'jsonp': true
    }).then((response) => {
      // Parseamos el XML devuelto
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(response.text, "text/xml");
      let error = xmlDoc.getElementsByTagName("error");
      // Elimino todas las opciones y creo la básica
      //JGL: el length = 0 puede dar problemas en algunos navegadores
      this.selectMunicipality_.innerHTML = null;
      this.createMunicipalityOption_("Municipio...", "");
      if (response.error) {
        M.dialog.error("Error al consultar al catastro: inténtelo de nuevo pasados unos segundos");
      } else if (error.length) {
        M.dialog.error("Error al consultar al catastro: " + error[0].childNodes[0].nodeValue);
      } else {
        let municipios = xmlDoc.getElementsByTagName("nm");
        for (let i = 0; i < municipios.length; i++) {
          let name = municipios[i].childNodes[0].nodeValue;
          this.createMunicipalityOption_(name, name);
        }
      }
    });
  }

  /**
   * Crea una opción y la annade a la lista de opciones de municipios
   *
   * @param {any} name
   * @param {any} value
   * @memberof CatastroSearchControl
   */
  createMunicipalityOption_(name, value) {
    let opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = name;
    this.selectMunicipality_.appendChild(opt);
  }

  /**
   *
   *
   * @memberof CatastroSearchControl
   */
  getCoordinatesRC(refCatastral) {
    let coordinatesURL = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC";
    M.remote.get(coordinatesURL, {
      Provincia: '',
      Municipio: '',
      SRS: 'EPSG:4326',
      RC: refCatastral
    }, {
      'jsonp': true
    }).then((response) => {
      // Parseamos el XML devuelto
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(response.text, "text/xml");
      let error = xmlDoc.getElementsByTagName("des");
      if (error.length) {
        M.dialog.error(error[0].childNodes[0].nodeValue);
      } else {
        let xCoord = xmlDoc.getElementsByTagName("xcen")[0].childNodes[0].nodeValue;
        let yCoord = xmlDoc.getElementsByTagName("ycen")[0].childNodes[0].nodeValue;
        // Elimino todas las búsquedas anteriores, evitando que se reinicie el componente
        this.getImpl().clearCoordinatesLayer();
        // Convierto la latitud y longitud de la proyección seleccionada a la proyección del mapa y la annado al la capa de coordenadas
        this.getImpl().addCoordToMap(xCoord, yCoord, 'EPSG:4326');
        this.getImpl().centerLayer();
      }
    });
  }

  /**
   *
   *
   * @memberof CatastroSearchControl
   */
  getRCFromPP() {
    if (M.utils.isNullOrEmpty(this.inputRC_.value)) {
      let rcURL = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPPP";
      M.remote.get(rcURL, {
        Provincia: this.selectProvince_.value,
        Municipio: this.selectMunicipality_.value,
        Poligono: this.inputPolygon_.value,
        Parcela: this.inputParcel_.value
      }, {
        'jsonp': true
      }).then((response) => {
        // Parseamos el XML devuelto
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(response.text, "text/xml");
        let error = xmlDoc.getElementsByTagName("des");
        if (error.length) {
          M.dialog.info(error[0].childNodes[0].nodeValue);
        } else {
          // Construyo el nombre del registro catastral
          let pc1 = xmlDoc.getElementsByTagName("pc1");
          let pc2 = xmlDoc.getElementsByTagName("pc2");
          let rc = pc1[0].childNodes[0].nodeValue + pc2[0].childNodes[0].nodeValue;
          this.inputRC_.value = rc;
          this.getCoordinatesRC(this.inputRC_.value);
        }
      });
    } else {
      this.getCoordinatesRC(this.inputRC_.value);
    }
  }


}