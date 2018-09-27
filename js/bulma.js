// The following code is based off a toggle menu by @Bradcomp
// source: https://gist.github.com/Bradcomp/a9ef2ef322a8e8017443b626208999c1
// (function() {
//     var burger = document.querySelector('.nav-toggle');
//     var menu = document.querySelector('.nav-menu');
//     burger.addEventListener('click', function() {
//         burger.classList.toggle('is-active');
//         menu.classList.toggle('is-active');
//     });
// })();


/// https://github.com/hunzaboy/bulma-megamenu

document.addEventListener('DOMContentLoaded', function() {

    // Get all "navbar-burger" elements
    var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Check if there are any nav burgers
    if ($navbarBurgers.length > 0) {

        // Add a click event on each of them
        $navbarBurgers.forEach(function($el) {
            $el.addEventListener('click', function() {

                // Get the target from the "data-target" attribute
                var target = $el.dataset.target;
                var $target = document.getElementById(target);

                // Toggle the class on both the "navbar-burger" and the "navbar-menu"
                $el.classList.toggle('is-active');
                $target.classList.toggle('is-active');

            });
        });
    }

});




// quickview


function closest(el, selector) {
    var matchesFn;

    // find vendor prefix
    ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function(fn) {
        if (typeof document.body[fn] == 'function') {
            matchesFn = fn;
            return true;
        }
        return false;
    });

    var parent;

    // traverse parents
    while (el) {
        parent = el.parentElement;
        if (parent && parent[matchesFn](selector)) {
            return parent;
        }
        el = parent;
    }

    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all document sliders
    var showQuickview = document.querySelectorAll('[data-show="quickview"]');
    [].forEach.call(showQuickview, function(show) {
        var quickview = document.getElementById(show.dataset['target']);
        if (quickview) {
            // Add event listener to update output when slider value change
            show.addEventListener('click', function(event) {
                quickview.classList.add('is-active');
            });
        }
    });

    // Get all document sliders
    var dismissQuickView = document.querySelectorAll('[data-dismiss="quickview"]');
    [].forEach.call(dismissQuickView, function(dismiss) {
        var quickview = closest(dismiss, '.quickview');
        if (quickview) {
            // Add event listener to update output when slider value change
            dismiss.addEventListener('click', function(event) {
                quickview.classList.remove('is-active');
            });
        }
    });
});

/// 

// document.addEventListener('DOMContentLoaded', function() {

//     // Get all "navbar-search" elements
//     var $navbarSearch = Array.prototype.slice.call(document.querySelectorAll('.navbar-search'), 0);

//     // Check if there are any nav searches
//     if ($navbarSearch.length > 0) {

//         // Add a click event on each of them
//         $navbarSearch.forEach(function($el) {
//             $el.addEventListener('click', function() {

//                 // Get the target from the "data-target" attribute
//                 var target = $el.dataset.target;
//                 var $target = document.getElementById(target);

//                 // Toggle the class on both the "navbar-search" and the "navbar-menu"
//                 $el.classList.toggle('is-active');
//                 $target.classList.toggle('is-active');

//             });
//         });
//     }

// });