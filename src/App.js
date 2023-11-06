import './App.css';
import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import ParticlesBg from 'particles-bg';
import Rank from "./components/Rank/Rank";
import React, { Component } from "react";
import Signin from "./components/Signin/Signin";
import Register from "./components/Register/Register";


   const returnClarifaiRequestOptions = (imageUrl) => {
   const PAT = '1c4dad4146694636a97b01741f89cc10';
   const USER_ID = 'mbraje90';       
   const APP_ID = 'my-first-application-hr861k';
   const MODEL_ID = 'face-detection';
   const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105'; 
   const IMAGE_URL = imageUrl;


    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });
     const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };
    return requestOptions
}
    
const initialState = {
   input: '',
      imageUrl: "",
      box: {},
      route: "signin",
      isSignedIn: false,
      user: {
        id:"",
        name: "",
        email: "",
        entries: 0,
        joined: ""
      }
   }

class App extends Component {
 constructor() {
    super();
    this.state = initialState;
}


  loadUser = (data) => {
    this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
    }
});
  }

  calculateFaceLocation = (data) => {
   const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
   const image = document.getElementById("inputimage");
   const width = Number(image.width);
   const height = Number(image.height);
   return {
    leftCol: clarifaiFace.left_col * width,
    topRow: clarifaiFace.top_row * height,
    rightCol: width - (clarifaiFace.right_col * width),
    bottomRow: height - (clarifaiFace.bottom_row * height) 
   }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }


  onInputChange = (event) => {
   this.setState({input: event.target.value});
  }

onButtonSubmit = () => {
  this.setState({ imageUrl: this.state.input });
  fetch(
    "https://api.clarifai.com/v2/models/face-detection/versions/6dc7e46bc9124c5c8824be4822abe105/outputs",
    returnClarifaiRequestOptions(this.state.input)
  )
    .then(response => {
      if (response.ok) {
        return response.json(); 
      } else {
        throw new Error('Failed to fetch data from Clarifai API');
      }
    })
    .then(data => {
      if (data) {
        fetch("http://localhost:3000/image", {
          method: "put",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: this.state.user.id 
          })
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to update user data');
            }
          })
          .then(count => {
            this.setState(Object.assign(this.state.user, { entries: count }));
          })
          .catch(err => console.log(err));
      }
      this.displayFaceBox(this.calculateFaceLocation(data));
    })
    .catch(err => console.log(err));
};
onRouteChange = (route) => {
  if (route === "signout") {
    this.setState(initialState)
  } else if (route === "home") {
    this.setState({isSignedIn: true})
  }
  this.setState({route: route});

}

render() {
 const { isSignedIn, imageUrl, route, box } = this.state;
  return (
    <div className="App">
      <ParticlesBg className="particles" color="#AB1C4D"
       num={100} type="cobweb" bg={true} 
       />
      <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
      { route === "home" 
        ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
            <ImageLinkForm 
              onInputChange={this.onInputChange} 
              onButtonSubmit={this.onButtonSubmit} 
             />
            <FaceRecognition box={box} imageUrl={imageUrl} />
            </div>
           : (
            route === "signin" 
            ? <Signin  loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <Register  loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            )
        
      }
          
      </div>
   
  );
}
}



export default App;


/**/