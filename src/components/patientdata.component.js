
import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import ReactJson from 'react-json-view'

export default class PatientData extends Component {

    constructor(props) {
        super(props);

        this.state = {
            patientData: {},
            patientId: "",
            patientList: [],
            redirectToLogin: false
        }

        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount(){
        const baseUrl = `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_NODE_PORT}`;
        axios.get(`${baseUrl}/listPatients`, {withCredentials: true}).then(response => {
            this.setState({
                patientList: response.data
            });

        }).catch(error => {

            if(error.response.status === 401){
                this.setState({
                    redirectToLogin: true
                });
            }
            // TODO: Error page in else condition
        });
    }

    handleSelect(eventKey) {

        if (this.state.patientId !== eventKey){
            console.log(eventKey)
            this.setState({
                patientId: eventKey
            });

            const baseUrl = `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_NODE_PORT}`;
            axios.get(`${baseUrl}/getPatientData?patientId=${this.state.patientId}`, {withCredentials: true}).then(response => {
                this.setState({
                    patientData: response.data
                });
          }).catch(error => {
            if(error.response.status === 401){
                this.setState({
                    redirectToLogin: true
                });
            }
          });
        }
    }

  render() {
	if (this.state.redirectToLogin === true) {
	  return <Redirect to="/login" />;
	}

	return (
	  <Container>
		<br />
		<Row>
		  <h3 className="mr-5">Display Patient Data</h3>
		  <DropdownButton title="Patient Id" onSelect={this.handleSelect}>
			{this.state.patientList.map(patientId => {
			  return (
				<Dropdown.Item key={patientId} eventKey={patientId}>
				  {patientId}
				</Dropdown.Item>
			  );
			})}
		  </DropdownButton>
		</Row>

		<br />
		{/* For the sake of time, using a plugin to show interactive JSON. TODO: Implement interactive table from nested JSON */}
		<ReactJson src={this.state.patientData} name={this.state.patientId} />
	  </Container>
	);
  }
}

