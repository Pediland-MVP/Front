import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{
            userAgent: ["Googlebot", "Bingbot", "YandexBot", "Applebot"],
            disallow: ["/"]
        },{
            userAgent: "*",
            allow: "/"
        }]
    }
}