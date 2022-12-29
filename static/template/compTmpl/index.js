module.exports = {
  run: async function (inputs, info) {
    try {
      const code = require('./code.js');
      const res = await code(inputs);
      console.log(JSON.stringify({ result: res, info }));
      return res;
    } catch (e) {
      console.error(JSON.stringify({ error: e.toString(), info }));
      process.exit(0);
    }
  },
};
