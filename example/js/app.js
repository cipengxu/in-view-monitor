import React, { Component } from 'react';
import { render } from 'react-dom';
import { Usage } from './usage';
import '../css/app.css';
import '../../style.css';

export default class App extends Component {
  render() {
    return <Usage />;
  }
}

render(<App />, document.getElementById('root'));
