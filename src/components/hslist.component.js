
import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

export default class HSList extends Component {

    constructor(){
        super()
        this.state = {
            systems: [],
            redirectToLogin: false
        }
    }

    componentDidMount() {
        const baseUrl = `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_NODE_PORT}`;
        axios.get(`${baseUrl}/listHealthSystems`, {withCredentials: true}).then(response => {
            this.setState({
                systems: response.data.systems
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

  render() {
	if (this.state.redirectToLogin === true) {
	  return <Redirect to="/login" />;
	}
	return (
	  <Container>
		<br />
		<h3>Healthcare Systems</h3>

		<ListGroup>
		  {this.state.systems.map(system => {
			return (
			  <ListGroup.Item action key={system.url} href={system.url}>
				{system.name}
			  </ListGroup.Item>
			);
		  })}
		</ListGroup>
	  </Container>
	);
  }
}

