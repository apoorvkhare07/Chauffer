import {useEffect,useState} from 'react';
import {viewablePhoto} from './photoUpload';
export default function usePhotoPreview(file){
 const [state,setState]=useState({file:null,url:'',pending:false,error:''});
 useEffect(()=>{
  let cancelled=false,url='';
  if(!file){setState({file:null,url:'',pending:false,error:''});return;}
  setState({file,url:'',pending:true,error:''});
  viewablePhoto(file).then(blob=>{if(cancelled)return;url=URL.createObjectURL(blob);setState({file,url,pending:false,error:''});}).catch(error=>{if(!cancelled)setState({file,url:'',pending:false,error:error.message});});
  return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
 },[file]);
 return state.file===file?state:{file,url:'',pending:Boolean(file),error:''};
}
