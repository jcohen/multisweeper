(function(multisweeper, $) {
    Handlebars.registerHelper("index", function(array, fn, elseFn) {
        if (array && array.length > 0) {
            var buffer = "";
            for (var i = 0, j = array.length; i < j; i++) {
                var item = array[i];
                if (typeof item === 'object') {
                    item.idx = i;
                    buffer += fn(item);
                } else {
                    buffer += fn({"item": item, idx: i});
                }
            }

            return buffer;
        }
        else {
            return elseFn();
        }
    });

    Handlebars.registerHelper("classForCell", function(cellContent) {
        var css = "";
        if (cellContent.idx === 0) {
            css += " left"
        }

        switch (cellContent.item) {
            case "." :
                css += " unknown";
                break;
            case "F" :
                css += " flag";
                break;
            default :
                if (typeof cellContent.item === "number") {
                    css += " revealed";
                }
                break;
        }

        return css;
    });

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