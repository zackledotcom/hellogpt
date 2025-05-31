export class AbstractSecurityRule {
    enable({ app }) {
        app.on('web-contents-created', (_, contents) => this.applyRule(contents));
    }
}
