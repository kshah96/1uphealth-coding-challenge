import React, {
    Component
} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import axios from 'axios';
import {
    Redirect
} from 'react-router-dom';

export default class Login extends Component {

    constructor(props) {
        super(props);

        this.state = {
            email: '',
            redirectToHSList: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        this.setState({
            email: e.target.value
        });
    }
    handleSubmit(e) {
        e.preventDefault();

        const url = `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_NODE_PORT}`;
        axios.post(`${url}/login`, {
            email: this.state.email
        }, {
            withCredentials: true
        }).then(response => {
            this.setState({
                email: '',
                redirectToHSList: true
            });
        }).catch(error => {
            // TODO: Error page
        });
    }

    render() {
        if (this.state.redirectToHSList === true) {
            return <Redirect to = '/listHealthcareSystems' / >
        }
        return (
			<Container>
			  <br />
			  <h3> Log In / Sign Up </h3>
			  <Form onSubmit={this.handleSubmit}>
				<Form.Group controlId="formBasicEmail">
				  <Form.Label> Email address </Form.Label>
				  <Form.Control
					type="email"
					required
					value={this.state.email}
					onChange={this.handleChange}
					placeholder="Enter email"
				  />
				  <Form.Text className="text-muted">
					Enter your email and we 'll direct you to your health system logon
					page(s)
				  </Form.Text>
				</Form.Group>
				<Button variant="primary" type="submit">
				  Submit
				</Button>
			  </Form>
			</Container>
        );
    }
}
