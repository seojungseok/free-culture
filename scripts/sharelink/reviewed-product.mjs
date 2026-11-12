// The provider's thumbnail can differ from its first main image.
export function matchesReviewedProduct(choice,product){
 return Boolean(choice&&product&&product.tacaItemId===choice.id&&product.displayName===choice.expectedName&&!product.isSoldOut&&
  (product.thumbnailUrl===choice.imageUrl||Array.isArray(product.mainImageUrls)&&product.mainImageUrls.includes(choice.imageUrl)));
}
