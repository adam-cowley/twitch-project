import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

import './App.css';

import { Menu } from 'semantic-ui-react';

import Home from './views/Home'
import Movie from './views/Movie'


function App() {
  return (
    <div className="App">
      <Router>
        <Menu>
          <Menu.Item as={Link} to="/">Neoflix</Menu.Item>
        </Menu>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/movie/:id" component={Movie} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
