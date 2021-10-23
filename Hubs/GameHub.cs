using GuessNationality.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GuessNationality.Hubs
{
    public class GameHub : Hub
    {
        private static List<Game> _games = new List<Game>();

        private static List<Person> GetList()
        {
            var list = new List<Person>();
            list.Add(new Person { Id = "1", Filename = "1.jpg", Nationality = Nationalities.Chinese });
            list.Add(new Person { Id = "2", Filename = "2.jpg", Nationality = Nationalities.Chinese });
            list.Add(new Person { Id = "3", Filename = "3.jpg", Nationality = Nationalities.Chinese });
            list.Add(new Person { Id = "4", Filename = "4.jpg", Nationality = Nationalities.Japanese });
            list.Add(new Person { Id = "5", Filename = "5.jpg", Nationality = Nationalities.Japanese });
            list.Add(new Person { Id = "6", Filename = "6.jpg", Nationality = Nationalities.Japanese });
            list.Add(new Person { Id = "7", Filename = "7.jpg", Nationality = Nationalities.Korean });
            list.Add(new Person { Id = "8", Filename = "8.jpg", Nationality = Nationalities.Korean });
            list.Add(new Person { Id = "9", Filename = "9.jpg", Nationality = Nationalities.Korean });
            list.Add(new Person { Id = "10", Filename = "10.jpg", Nationality = Nationalities.Thai });
            list.Add(new Person { Id = "11", Filename = "11.jpg", Nationality = Nationalities.Thai });
            list.Add(new Person { Id = "12", Filename = "12.jpg", Nationality = Nationalities.Thai });

            return list;
        }



        public async Task Start()
        {
            var list = GetList();
            var item = new Game
            {
                List = list,
                Person = list.OrderBy(r => Guid.NewGuid()).FirstOrDefault(),
                Score = 0,
                Current = 1,
                Total = list.Count,
            };

            var game = _games.FirstOrDefault(r => r.User == Context.ConnectionId);
            if (game is null)
            {
                item.User = Context.ConnectionId;

                lock (_games)
                {
                    _games.Add(item);
                }
            }
            else
            {
                lock (_games)
                {
                    game.List = item.List;
                    game.Person = item.Person;
                    game.Score = item.Score;
                    game.Current = item.Current;
                    game.Total = item.Total;
                }
            }

            await Clients.Caller.SendAsync("Started",
                new { Person = new { item.Person.Id, item.Person.Filename }, item.Score, item.Current, item.Total });
        }

        public async Task Check(string id, string nationality)
        {
            var game = _games.FirstOrDefault(r => r.User == Context.ConnectionId);
            if (game is null)
            {
                await Clients.Caller.SendAsync("Error");
            }
            else
            {
                var item = game.List.FirstOrDefault(r => r.Id == id);

                lock (_games)
                {
                    if (nationality is null || item is null || item.Nationality != nationality)
                    {
                        game.Score -= 5;
                        item.SelectedNationality = "none";
                    }
                    else
                    {
                        game.Score += 20;
                        item.SelectedNationality = nationality;
                    }
                }

                await Clients.Caller.SendAsync("Checked", new { result = item.Nationality == nationality, game.Score, game.Current });
            }
        }

        public async Task Next()
        {
            var game = _games.FirstOrDefault(r => r.User == Context.ConnectionId);
            if (game is null)
            {
                await Clients.Caller.SendAsync("Error");
            }
            else
            {
                if (game.Current == game.Total)
                {
                    await Finish();
                }
                else
                {
                    lock (_games)
                    {
                        game.Current += 1;
                        game.Person = game.List.Where(r => r.SelectedNationality is null).OrderBy(r => Guid.NewGuid()).FirstOrDefault();
                    }

                    await Clients.Caller.SendAsync("Nexted",
                        new { Person = new { game.Person.Id, game.Person.Filename }, game.Score, game.Current, game.Total });
                }
            }
        }

        private async Task Finish()
        {
            var game = _games.FirstOrDefault(r => r.User == Context.ConnectionId);
            if (game is null)
            {
                await Clients.Caller.SendAsync("Error");
            }
            else
            {
                await Clients.Caller.SendAsync("Finished", game.Score);
            }
        }

    }
}
