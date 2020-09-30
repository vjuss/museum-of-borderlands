const MODEL_URL = '/models/final/model.json';

const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

const serverURL = 'localhost:3000'
const socket = io.connect(serverURL);
const video = document.querySelector("video");


const constraints = {
  video: { facingMode: "user", width: 400, height: 400 }
  // Uncomment to enable audio
  // audio: true,
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(stream => {
    video.srcObject = stream;
    socket.emit("broadcaster");
  })
  .catch(error => console.error(error));

  socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = video.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
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
    myPredict = setInterval (predictLoop, 2000); // calls prediction loop every 2 secs

  }

  async function predictLoop () {
    tf.engine().startScope();
    var img = document.getElementById("webcam");
    var processed=preprocessImage(img, "mobilenet")
    window.prediction=model.predict(processed) // actual prediction
    window.prediction.print();

    const result=model.predict(processed);
    const predictionLabel = result.as1D().argMax().dataSync()[0];
    var newLabel = labels[predictionLabel];
    const predict = await result.data();
    const value = predict[predictionLabel];


    document.getElementById("caption").innerHTML = `
    We can see : ${newLabel}\n
    Confidence is: ${value}\n
    `;


    if (newLabel== "a threat" && newLabel !==oldLabel){
        var data = {
        speed: 1000
      }
      sendParam ("/sound", 1);
    }


    else if (newLabel== "a danger" && newLabel !==oldLabel){
        var data = {
        speed: 1000
      }
      sendParam ("/sound", 2);
    }


    else if (newLabel== "security" && newLabel !==oldLabel){
      sendParam ("/sound", 3); //
    }


    else if (newLabel== "a human" && newLabel !==oldLabel){
      sendParam ("/sound", 4);
    }

    else {
      console.log ("No changes");
      }

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


} //closes app

app();

function sendParam(adr, val) {
  let data = {
    address: adr,
    val: val
  };
  socket.emit('param', data)
}
