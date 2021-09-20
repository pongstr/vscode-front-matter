const fs = require('fs');
const path = require('path');

const pkgJson = require('../../package.json');

if (pkgJson?.contributes?.configuration) {
    const idUrl = process.env.VERCEL_ENV === "preview" ? "https://beta.frontmatter.codes/frontmatter.schema.json" : "https://frontmatter.codes/frontmatter.schema.json";

    const schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": idUrl,
        ...pkgJson.contributes.configuration,
        "title": "Front Matter - Team Settings"
    }

    fs.writeFileSync(path.join(path.resolve('.'), '/public/frontmatter.schema.json'), JSON.stringify(schema, null, 2));
}