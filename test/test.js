import CatastroSearch from 'facade/catastrosearch';

const map = M.map({
  container: 'mapjs',
});

const mp = new CatastroSearch();

map.addPlugin(mp);
