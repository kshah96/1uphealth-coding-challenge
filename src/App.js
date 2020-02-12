import React from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";

import Login from "./components/login.component";
import HSList from "./components/hslist.component";
import Container from 'react-bootstrap/Container';
import PatientData from './components/patientdata.component';

function App() {
  return (
    <Router>
      <Container>
          <Route path="/" exact component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/listHealthcareSystems" component={HSList} />
          {/* TODO: Redirect callback to a route name that makes more sense.. */}
          <Route path="/callback" component={PatientData} />
      </Container>
    </Router>
  );
}

export default App;
