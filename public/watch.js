const MODEL_URL = 'http://localhost:3000/models/final/model.json';

let peerConnection;
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher");
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
  peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};



async function app() {

  const model = await tf.loadGraphModel(MODEL_URL);
  console.log('Successfully loaded model');
  const labels = ["a human", "security", "a threat", "a danger"];
  console.log(labels);
  var oldLabel = undefined;


  async function predictFunction () {
    myPredict = setInterval (predictLoop, 2000);
  }


  async function predictLoop () {

    tf.engine().startScope();

    var img = document.getElementById("webcam");
    var processed=preprocessImage(img, "mobilenet")
    window.prediction=model.predict(processed)
    window.prediction.print();

    const result=model.predict(processed);
    const predictionLabel = result.as1D().argMax().dataSync()[0];
    var newLabel = labels[predictionLabel];
    const predict = await result.data();
    const value = predict[predictionLabel];


    document.getElementById("caption").innerHTML = `
    We can see: ${newLabel}\n
    Confidence is: ${value}\n
    `;

    result.dispose();
    tf.engine().endScope();
    await tf.nextFrame();
    oldLabel = newLabel;

  }

  predictFunction();



  function preprocessImage(image,modelName){
    tf.engine().startScope();
    let tensor=tf.browser.fromPixels(image)
      .resizeNearestNeighbor([224,224])
      .toFloat();
      console.log('tensor pro', tensor);
      if(modelName==undefined)
      {
          return tensor.expandDims();
      }
      if(modelName=="mobilenet")
      {
          let offset=tf.scalar(127.5);
          return tensor.sub(offset)
          .div(offset)
          .expandDims();
      }
      else
      {
          throw new Error("Unknown Model error");
      }
      tensor.dispose();
      tf.engine().endScope();
    }

} // closes app


app();
