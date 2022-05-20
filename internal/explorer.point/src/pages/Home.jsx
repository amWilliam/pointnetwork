import Container from 'react-bootstrap/Container'

import { useState,useEffect } from "react";
import { useAppContext } from '../context/AppContext';
import Loading from '../components/Loading';
import appLogo from '../assets/pointlogo.png'
import Markdown from 'markdown-to-jsx';

export default function Home() {
  const { walletIdentity } = useAppContext();
  const [zapps, setZapps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMD, setIsLoadingMD] = useState(true)
  const [markdown, setMarkdown] = useState('')

  const featuredZapps = {
    'blog.point': "Blog",
    'social.point': 'Point Social',
    'email.point': 'Email',
  }

  useEffect(()=>{
    fetchZappsDeployed();
    fetchMarkdown();
  },[])

  const fetchMarkdown = async () => {
    setIsLoadingMD(true);
    try{
      let id = await window.point.contract.call({host: '@', contract: 'Identity', 
        method: 'ikvGet',  params: ['explorer','markdown/index']});
      let markdownData = await window.point.storage.getString({ id: id.data, encoding: 'utf-8' });
      setMarkdown(markdownData.data);
    }catch(e){
      setMarkdown('');
    }
    setIsLoadingMD(false);
  }

  const fetchZappsDeployed = async () => {
    setIsLoading(true);
    let zappsDeployed = [];
    for (let k in featuredZapps){

      let zappRoutes = await window.point.contract.call({host: '@', contract: 'Identity', 
      method: 'ikvGet',  params: [k.replace('.point', ''),'zdns/routes']});
      if(zappRoutes.data !== ''){
        zappsDeployed.push(k);
      }
    }
    setZapps(zappsDeployed);
    setIsLoading(false);
  }

  const openWeb2Url = (url) => {
    fetch('/v1/api/web2/open', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({urlToOpen: url})
    });
  }

  const renderZappEntry = (k) => {
    return (
      <a href={ 'https://' + k } target="_blank">
        <div className="zapp" key={k}>
          <div className="zapp-icon-container">
            <img alt={k} className="zapp-icon" src={`https://${k}/favicon.ico`}
              onError={({ currentTarget }) => { currentTarget.src = appLogo; }}
            />
          </div>
          <div className="zapp-title-container">
            <span>{ featuredZapps[k] }</span>
          </div>
        </div>
      </a>
    )
  }

  let zappsList = <p>No Apps deployed yet.</p>;
  if(zapps.length > 0){
    zappsList = <div className="zapps">{zapps.map((k) => renderZappEntry(k))}</div>;
  }
  

  return (
    <>
      <Container className="p-3">
        <br/>
        <br/>
        <h1 className="header">Welcome to Web 3.0, <strong>@{!walletIdentity ? <Loading /> : walletIdentity}</strong>!</h1>

        {isLoadingMD ? <Loading /> : <Markdown>{markdown}</Markdown>} 

        <p><a onClick={() => openWeb2Url('https://bounty.pointnetwork.io/')} href="#" ><img src="banner.jpg"></img></a></p>

        <h5>Explore featured Apps</h5>
        {isLoading ? <Loading /> : zappsList}


      </Container>
    </>
  );
}
