<h2>widget run!</h2>
{%script%}
    seajs.use('photo:widget/list/list.js', function(list){
        console.log(list);
    });
{%/script%}