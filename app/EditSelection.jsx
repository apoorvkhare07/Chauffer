import React from 'react';
import './edit-selection.css';
export default function EditSelection({product}){
 if(!product)return null;
 return <aside className="edit-selection" aria-label={`Selected from ${product.editTitle}`}><img src={product.image} alt={product.description}/><div><span>FROM {product.editTitle.toUpperCase()}</span><strong>{product.name}</strong><a href={product.editPath}>Back to this post</a></div></aside>;
}
