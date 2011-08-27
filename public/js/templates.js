(function(multisweeper, $) {
    var loadedTemplates = {};

    var Templates = multisweeper.Templates = function() {

    };

    Templates.prototype.get = function(templateName, callback) {
        if (loadedTemplates[templateName]) {
            return callback(loadedTemplates[templateName]);
        }

        $.ajax("/templates/" + templateName + ".hbs", {
            "success" : function(data) {
                loadedTemplates[templateName] = Handlebars.compile(data);
                callback(loadedTemplates[templateName]);
            },
            "error" : function() {
                console.error("Failed to get template: " + templateName);
            }
        })
    };

    Templates.prototype.preload = function() {
        var templates = [ "board" ];

        for (var i = 0, l = templates.length; i < l; i++) {
            var template = templates[i];

            this.get(template, function() {});
        }
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);