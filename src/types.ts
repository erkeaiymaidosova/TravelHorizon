export type Tour={slug:string;title:string;place:string;days:number;price:number;level:string;season:string;type:string;img:string;desc:string;published?:boolean;i18n?:Partial<Record<'ru'|'es',{title:string;desc:string}>>};
export type Photos=Record<string,string>;
