import React from 'react';
export default class PageBoundary extends React.Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidUpdate(previous){if(previous.page!==this.props.page&&this.state.failed)this.setState({failed:false});}
 render(){return this.state.failed?<section className="account-card" role="alert"><h1>This page is unavailable</h1><p>We could not load this page right now. Try again or return to For you.</p><div className="account-actions"><button className="button primary" onClick={()=>this.setState({failed:false})}>Try again</button><a className="chat-chip" href="#/home">Back to For you</a></div></section>:this.props.children;}
}
