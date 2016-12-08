const Worker = require('worker-loader!./../worker/bsp-worker');

class BSP {
  _worker = null;

  constructor () {
    this.initialize();

    this._worker.postMessage({
      type: 'load',
      url: '/q3tourney2.bsp',
      tesselationLevel: 5
    });
  }

  initialize () {
    this._worker = new Worker;

    this._worker.onmessage = (message) => {
      this.onMessage(message);
    };

    this._worker.onerror = (message) => {
      console.error(`Line: ${message.lineno}, ${message.message}`);
    };
  }

  onMessage (message) {
    console.log(message.data);
  }
}

export default BSP;
