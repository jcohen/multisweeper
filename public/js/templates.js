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

    Handlebars.registerHelper("inc", function(val, fn, elseFn) {
        return val + 1;
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
            case "B" :
                css += " bomb";
                break;
            default :
                if (typeof cellContent.item === "number") {
                    css += " revealed nearby" + cellContent.item;
                }
                break;
        }

        return css;
    });

    Handlebars.registerHelper("nthIfy", function(value) {
        var coerced = "" + value;
        switch (coerced) {
            case "1" :
                return "1st";
            case "2" :
                return "2nd";
            case "3" :
                return "3rd";
            default:
                return value + "th";
        }
    });

    Handlebars.registerHelper("isCurrent", function(context, thisPlayer, block) {
        if (thisPlayer === context.currentPlayer) {
            return " current"
        }
    });

    var loadedTemplates = {};

    var Templates = multisweeper.Templates = function() {
        this.preloaded = false;
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
        if (this.preloaded) { return; }

        var templates = [ "board", "game", "gameover", "modal", "message" ];

        for (var i = 0, l = templates.length; i < l; i++) {
            var template = templates[i];

            this.get(template, function() {});
        }

        this.preloaded = true;
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);