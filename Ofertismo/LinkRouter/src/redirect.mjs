// Short-lived operation receipts prevent duplicate redirect reservations.
// Not a visitor identifier: new random value per page/action, no IP/cookie or history.
import {nextClick,cleanSource,dateInSaoPaulo} from './rotation.mjs';
export const RECEIPT_TTL=120000, RECEIPT_LIMIT=256;
export function validOperation(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)}
export function reserveRedirect(config,metrics,receipts,input,now=Date.now()){
 const operation=validOperation(input.operation)?input.operation:null;
 const entries=Object.entries(receipts||{}).filter(([k,v])=>validOperation(k)&&Number.isFinite(v?.at)&&v.at<=now&&now-v.at<RECEIPT_TTL).sort((a,b)=>a[1].at-b[1].at);
 const recent=Object.fromEntries(entries.slice(-RECEIPT_LIMIT));
 if(operation&&Object.hasOwn(recent,operation)){
  const old=recent[operation],target=config.groups.find(g=>g.id===old.group);
  return {target:target||null,metrics,receipts:recent,repeated:true,reason:target?'ok':'no_groups'};
 }
 const result=nextClick(config,metrics,cleanSource(input.source),dateInSaoPaulo(new Date(now)),input.campaign,input.creative);
 if(result.target&&operation){
  while(Object.keys(recent).length>=RECEIPT_LIMIT)delete recent[Object.keys(recent)[0]];
  recent[operation]={at:now,group:result.target.id};
 }
 return {...result,receipts:recent,repeated:false};
}
