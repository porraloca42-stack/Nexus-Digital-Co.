// One registry for the landing, router and aggregate counters. Only approved campaign/creative codes.
// Never put user-provided labels, identifiers or URLs here.
export const CREATIVE_REGISTRY=Object.freeze({oft_t03:Object.freeze(['imagem_01','video_01'])});
export function knownCreative(campaign,creative){
 return typeof campaign==='string'&&typeof creative==='string'&&Object.hasOwn(CREATIVE_REGISTRY,campaign)&&CREATIVE_REGISTRY[campaign].includes(creative);
}
