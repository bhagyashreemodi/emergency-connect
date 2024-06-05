import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export default class SwaggerConfig {
    constructor(app) {
        this.app = app;
        this.options = {
            definition: {
                failOnErrors: true,
                openapi: '3.0.0',
                info: {
                    title: 'Emergency Social Network APIs',
                    description: 'APIs for Emergency Social Network',
                    version: '1.0.0',
                }
            },
            apis: ['./routes/*.js'],

        };
    }

    generateDocs() {
        const specs = swaggerJsDoc(this.options);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    }
}