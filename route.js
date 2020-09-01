import models from "../../models";
import {Op} from "sequelize";
import getFetchedProduct from "../../api/v1/fetchProduct";
import searchProducts from "../../api/v1/searchProducts";

export default class Product {
    static resolver() {
        return {
            Query: {
                product: (parent, {id}, ast, info) => models.Product.findByPk(id)
                    .then(product => getFetchedProduct(product)),
                products: (parent, {ids}, ast, info) => {
                    let options = {};
                    if (ids) {
                        options.where = {
                            id: {
                                [Op.in]: ids
                            },
                        };
                    }
                    return models.Product.findAll(options)
                        .then(products => {
                            return Promise.all(products.map(product => getFetchedProduct(product)))
                                .catch(e => console.error(e));
                        });

                },
                findProducts: (parent, {search, source}, ast, info) => {
                    if (!search) {
                        return [];
                    }
                    return searchProducts(search, source).then(data => {
                        if (!data || !data.length) {
                            return [];
                        }
                        const promises = data.map(product => getFetchedProduct(product, source));

                        return Promise.all(promises).catch(e => console.error(e));
                    });
                },
            },
            Product: {
                orderItems: (product) => product.getOrderItems(),
            },
        }
    }

    static typeDefs() {
        return `
            type Product {
                id: ID
                name: String
                url: String
                image: String
                sku: String
                price: Int
                available: Int
                orderItems: [OrderItem]
            }
        `;
    };
}