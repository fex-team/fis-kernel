{%html%}
{%head%}
    <meta charset="utf-8"/>
    <title>name-----</title>
{%/head%}
{%body%}
    
    {%require name="photo:sea.js"%}
    {%require name="photo:index.js"%}
    {%require name="photo:ui/a/a.js"%}
    {%script%}
        seajs.use('photo:ui/a/a.js', function(a){

        });
    {%/script%}
    <img src="npm.png"/>
    
    <h2>hello world fis.</h2>
    <p>I'm a boy.</p> 
    <h1>test1</h1>
    <h2>test2</h2>
    <h3>test3</h3>
    <h4>test4</h4>
    <!--widget-->
    {%widget name="photo:widget/list/list.tpl"%}
    
    {%require name="photo:index.css"%}
{%/body%}
{%/html%}