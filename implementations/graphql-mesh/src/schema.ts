import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "node:fs";
import { Resolvers } from "./resolvers-types";
import { products, deprecatedProduct, productResearch, user } from "./data";

const resolvers: Resolvers = {
  Query: {
    product(_, args) {
      return products.find((p) => p.id == args.id) || null;
    },
    deprecatedProduct(_, args) {
      if (
        args.sku === deprecatedProduct.sku &&
        args.package === deprecatedProduct.package
      ) {
        return deprecatedProduct;
      } else {
        return null;
      }
    },
    // Internal fields
    _resolveProduct(_, args) {
      if (args.id != null) {
        return products.find((product) => product.id === args.id) || null;
      }
      if (args.sku != null && args.package != null) {
        return (
          products.find(
            (product) =>
              product.sku === args.sku && product.package === args.package
          ) || null
        );
      }
      if (args.sku != null && args.variationId != null) {
        return (
          products.find(
            (product) =>
              product.sku === args.sku &&
              product.variation?.id === args.variationId
          ) || null
        );
      }
      return null;
    },
    _resolveDeprecatedProduct(_, args) {
      if (
        args.sku === deprecatedProduct.sku &&
        args.package === deprecatedProduct.package
      ) {
        return deprecatedProduct;
      }
      return null;
    },
    _resolveProductResearch(_, args) {
      return productResearch.find(p => p.study.caseNumber === args.studyCaseNumber) || null;
    }
  },
  DeprecatedProduct: {
    createdBy() {
      return user;
    },
  },
  Product: {
    variation(parent) {
      if (parent.variation) return parent.variation;
      const p = products.find((p) => p.id == parent.id);
      return p && p.variation ? p.variation : null;
    },

    research: (reference) => {
      if (reference.id === "apollo-federation") {
        return [productResearch[0]];
      } else if (reference.id === "apollo-studio") {
        return [productResearch[1]];
      } else {
        return [];
      }
    },

    dimensions() {
      return { size: "small", weight: 1, unit: "kg" };
    },

    createdBy() {
      return user;
    },
  },
  User: {
    averageProductsCreatedPerYear(user) {
      if (user.email != "support@apollographql.com") {
        throw new Error("user.email was not 'support@apollographql.com'");
      }
      return Math.round(
        (user.totalProductsCreated || 0) / user.yearsOfEmployment
      );
    },
    name() {
      return "Jane Smith";
    },
  },
};

export default makeExecutableSchema({
  typeDefs: readFileSync("./products.graphql", "utf8"),
  resolvers,
});
