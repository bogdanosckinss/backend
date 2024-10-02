import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { createReadStream } from 'fs';
import {writeFile} from 'fs';
import { promisify } from 'util';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

  async updateVideoModerationStatus(data): Promise<any> {
    let dataToUpdate = {
      under_moderation: false,
      allowed: data.allowed
    }

    if (data.allowed) {
      dataToUpdate['preview_url'] = data?.previewImage ?? ''
    }

    return this.dbService.video.update({
      data: dataToUpdate,
      where: {
        id: data.videoId
      }
    })
  }


  async deleteVideo(videoId: string): Promise<any> {
    return this.dbService.video.update({
      where: {
        id: parseInt(videoId)
      },
      data: {
        under_moderation: false,
        allowed: false,
        deleted: true
      }
    })
  }

  async uploadContent(userId: number, data: ProfileDTO, videoId: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: userId
      },
      data: {
        image: data.image,
        name: data.name,
        lastname: data.lastname,
        phone_number: data.phone_number.toString(),
        email: data.email,
        city: data.city,
        social_media_link: data.social_media_link,
        age: parseInt(String(data.age)),
        videos: {
          connect: {
            id: videoId
          }
        }
      },
    })
  }

  async uploadSong(data: any): Promise<any> {
    return this.dbService.song.create({
      data: {
        ...data
      }
    })
  }

  async getSongs(): Promise<any> {
    return this.dbService.song.findMany({
      orderBy: {
        id: 'desc'
      }
    })
  }

  async getVideosToModerate(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted
    ORDER BY video.created_at DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideosCount(): Promise<any> {
    const declinedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted`

    const acceptedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE video.allowed IS TRUE AND NOT video.under_moderation AND NOT video.deleted`

    const underModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted`

    const totalModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video WHERE NOT video.deleted`

    if (!declinedVideosCount || declinedVideosCount == 'unknown') {
      return 0
    }

    // @ts-ignore
    return {
      accepted: parseInt(acceptedVideosCount[0]?.counttoshow ?? 0),
      declined: parseInt(declinedVideosCount[0]?.counttoshow ?? 0),
      underModeration: parseInt(underModerationVideosCount[0]?.counttoshow ?? 0),
      total: parseInt(totalModerationVideosCount[0]?.counttoshow ?? 0)
    }
  }

  async getApprovedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE
    ORDER BY video.id DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getContent(id: number): Promise<any> {
    return {};
    // return this.dbService.video.findMany({
    //   //take: 3, // TODO: remove
    //   where: {
    //     id: {
    //       not: {
    //         lt: 6
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
  }

  async findManyVideosByUsername(skip: string, query: string, userId: number, startVideoId: string): Promise<any> {
    const queryToUse = query == 'null' ? '' : query
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed AND (LOWER(CONCAT(userc.lastname, ' ', userc.name)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(CONCAT(userc.name, ' ', userc.lastname)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(userc.name) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(ss.title) LIKE LOWER(${'%' + queryToUse + '%'}))
    ORDER BY (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) DESC, video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
        video_likes: '',
        is_liked_by_me: parseInt(video.is_liked_by_me) > 0,
        videoLikes: parseInt(video.video_likes)
      }
    })
  }

  async cleanUsers(query: string): Promise<any> {
    // let data = ''
    // readXlsxFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content/ert.xlsx').then(rows => {
    //   for (const row in rows) {
    //     data += ('"' + rows[row][0] + '",\n')
    //   }
    //   this.createFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content', 'er.txt', data);
    // })
    //
    // return
    // const queryToUse = query == 'null' ? '' : query
    // if (queryToUse == '') {
    //   return {}
    // }

    return await this.dbService.$queryRaw`
        Delete from users as usr
        WHERE usr.email IN(
                           'grallezigosso-9186@yopmail.com',
                           'xeddoboimutti-3710@yopmail.com',
                           'sutetruxoucrei-2866@yopmail.com',
                           'wakayoifrazou-6925@yopmail.com',
                           'crippozaugrowa-5180@yopmail.com',
                           'veillommexaba-7629@yopmail.com',
                           'ralleitennemma-2788@yopmail.com',
                           'vaprobuquammoi-5045@yopmail.com',
                           'boucideupeutteu-5472@yopmail.com',
                           'frauvennemipra-3099@yopmail.com',
                           'craussoppatevu-2450@yopmail.com',
                           'lommoipafeirou-5915@yopmail.com',
                           'freihoicrafrire-7079@yopmail.com',
                           'greummicummoune-8205@yopmail.com',
                           'froubauddahaxe-2828@yopmail.com',
                           'houprifreloju-2894@yopmail.com',
                           'vouwimennaute-3642@yopmail.com',
                           'kuxetugeubei-6086@yopmail.com',
                           'zefraussullussi-1070@yopmail.com',
                           'leisasaucreupeu-1375@yopmail.com',
                           'sousikufreiwe-1853@yopmail.com',
                           'prilaquatrewau-1706@yopmail.com',
                           'wadesoucrese-9284@yopmail.com',
                           'tepenalettu-5428@yopmail.com',
                           'creinopuprallu-5665@yopmail.com',
                           'dipopexuza-1938@yopmail.com',
                           'faugreummogetto-8813@yopmail.com',
                           'wenneugroupreba-9749@yopmail.com',
                           'trauttomesoinni-2600@yopmail.com',
                           'caulletratrabre-3835@yopmail.com',
                           'julassauneicreu-3794@yopmail.com',
                           'praseheffemmi-7126@yopmail.com',
                           'braussounnequeiqui-3265@yopmail.com',
                           'gricrebuttaubri-6064@yopmail.com',
                           'feicrimmoupriyei-7069@yopmail.com',
                           'voprukafrebra-1397@yopmail.com',
                           'fremmimeimeubrou-4058@yopmail.com',
                           'buyoteujouppo-9872@yopmail.com',
                           'gulucetegre-8198@yopmail.com',
                           'neitetoirizeu-4018@yopmail.com',
                           'kw102013w@gmail.com',
                           'ranadeissoza-2274@yopmail.com',
                           'reilaxeitrouppei-9035@yopmail.com',
                           'nodourefusa-2069@yopmail.com',
                           'mosifrausepra-5768@yopmail.com',
                           'froibroubrequimmi-6156@yopmail.com',
                           'haucidofivo-9406@yopmail.com',
                           'peuyoikaxapo-6813@yopmail.com',
                           'hurennehona-6803@yopmail.com',
                           'jewoibreiduqueu-8135@yopmail.com',
                           'queimmopebrukoi-7420@yopmail.com',
                           'k36385216@gmail.com',
                           'vatafrakagu-4466@yopmail.com',
                           'croucoigucifre-9539@yopmail.com',
                           'vatauxeuffubi-7002@yopmail.com',
                           'brutebraceiyoi-3121@yopmail.com',
                           'zullummewatta-6869@yopmail.com',
                           'geifrufennema-5569@yopmail.com',
                           'yegepunnuni-4203@yopmail.com',
                           'mufeixujoufau-7790@yopmail.com',
                           'yemmoippoipuca-6915@yopmail.com',
                           'crijutoilleicru-3379@yopmail.com',
                           'hekebrageudi-8795@yopmail.com',
                           'luteicreullounei-2558@yopmail.com',
                           'meupeirisoitte-5244@yopmail.com',
                           'vesseihaudoda-1895@yopmail.com',
                           'prouzimmapeca-9169@yopmail.com',
                           'nameppopriheu-2585@yopmail.com',
                           'tuqueillahego-9854@yopmail.com',
                           'prefrasseiproitru-6361@yopmail.com',
                           'juvappeuttudu-2988@yopmail.com',
                           'moicrafaucruya-2843@yopmail.com',
                           'quexapragrucrau-5747@yopmail.com',
                           'wasetrusommau-5229@yopmail.com',
                           'froturommassi-7474@yopmail.com',
                           'veiddoittebracru-6513@yopmail.com',
                           'xaddufrigequa-9358@yopmail.com',
                           'yuwoubroipeudu-2397@yopmail.com',
                           'gaffeddeujare-1805@yopmail.com',
                           'queyauhocrahu-2755@yopmail.com',
                           'woupoitragappe-2089@yopmail.com',
                           'seuxammineiffo-4261@yopmail.com',
                           'yikapreumauquou-3896@yopmail.com',
                           'fatteisuddapu-8572@yopmail.com',
                           'fiffeuttissepre-9423@yopmail.com',
                           'quequotelillo-9827@yopmail.com',
                           'mavteuko@gmail.com',
                           'katreen1981@gmail.com',
                           'slepchenko22@inbox.ru',
                           'brousipeppaude-7396@yopmail.com',
                           'pafibenetru-5502@yopmail.com',
                           'agofbbwik@yomail.info',
                           'cettubroboukoi-7860@yopmail.com',
                           'broukauppiqueumei-6678@yopmail.com',
                           'zgfyiyihg@laste.ml',
                           'roucrupetillei-1811@yopmail.com',
                           'tufraufizeucu-9398@yopmail.com',
                           'larufubreru-8999@yopmail.com',
                           'ahgbcbxfl@10mail.org',
                           'brequoyeugreuttoi-7376@yopmail.com',
                           'preppeulleugrissa-1765@yopmail.com',
                           '04db48ctv0@freeml.net',
                           'xekauvubreissu-9876@yopmail.com',
                           'kefrizeubrege-6065@yopmail.com',
                           'traquagibrika-5769@yopmail.com',
                           'agelloosexwxup@dropmail.me',
                           'youquappahauqua-1252@yopmail.com',
                           'vutrayinnoussa-1070@yopmail.com',
                           'upwvalahg@laste.ml',
                           'grepreutratrovi-7403@yopmail.com',
                           'netrosazouyou-3073@yopmail.com',
                           'yugigoigriyu-1681@yopmail.com',
                           'agfhsorxe@yomail.info',
                           'cramoppamocri-8985@yopmail.com',
                           'yawuquetruja-7195@yopmail.com',
                           'rpiubkjhg@laste.ml',
                           'zirasequafau-3667@yopmail.com',
                           'tigouxoduxu-9772@yopmail.com',
                           'gtsdaboxh@emlpro.com',
                           'fratrapeuquexou-4173@yopmail.com',
                           'prufresseffeugra-5158@yopmail.com',
                           'dmtfjpnyi@emltmp.com',
                           'tremmaukumotri-5152@yopmail.com',
                           'noifrinnoizassu-4080@yopmail.com',
                           'froffoimoujuyou-3971@yopmail.com',
                           'stxkycoxh@emlpro.com',
                           'meugrowizonau-3716@yopmail.com',
                           'gaubruwoyepre-4201@yopmail.com',
                           'wouddouruyuge-9538@yopmail.com',
                           'x9v23v84@flymail.tk',
                           'treutubrellaufei-6739@yopmail.com',
                           'tagrugottitoi-5926@yopmail.com',
                           'xayadottoinei-5951@yopmail.com',
                           '044vh9xwaw@spymail.one',
                           'greuffemauroille-5315@yopmail.com',
                           'frequeuvedoira-9602@yopmail.com',
                           'vizuwezum0g3@10mail.xyz',
                           'soubreuhaufraullau-9875@yopmail.com',
                           'yovouffanabra-1427@yopmail.com',
                           'agelzloflqyhkj@dropmail.me',
                           'saulijenneuffou-9014@yopmail.com',
                           'sugroufrepape-7444@yopmail.com',
                           'xrbayh2e@minimail.gq',
                           'crimmoimaulennoi-7155@yopmail.com',
                           'lufrojeddillu-4602@yopmail.com',
                           '044vwb62g0@spymail.one',
                           'crebreubroivado-6638@yopmail.com',
                           'xauffotauppouyu-9751@yopmail.com',
                           'nuloinnavifau-3409@yopmail.com',
                           'agodbhxmu@yomail.info',
                           'sekeixatrufri-6816@yopmail.com',
                           'crauffosoilacre-5754@yopmail.com',
                           'agefxgrnoknhms@dropmail.me',
                           'dauxeureujagro-8096@yopmail.com',
                           'rummayafobru-7821@yopmail.com',
                           'mhojfexyi@emltmp.com',
                           'zazucroddaddo-9710@yopmail.com',
                           'crewebequeuffau-7802@yopmail.com',
                           'trovuproifeullo-2563@yopmail.com',
                           'dfqxsgkhg@laste.ml',
                           'meddumugotte-8917@yopmail.com',
                           'cileinibufroi-6484@yopmail.com',
                           'kunnauffidaffa-9786@yopmail.com',
                           'xa15hyh5@flymail.tk',
                           'zossaxehume-5357@yopmail.com',
                           'suxiffauyeda-9414@yopmail.com',
                           '044wax57wr@spymail.one',
                           'cennehaddabra-8378@yopmail.com',
                           'xrfy075w@minimail.gq',
                           'koulivoureiwu-3231@yopmail.com',
                           'fejecroutecrou-3049@yopmail.com',
                           'ahgmadnvq@10mail.org',
                           'nagaweutatrau-7855@yopmail.com',
                           'nitrummupoinni-3535@yopmail.com',
                           'yollucekasau-1039@yopmail.com',
                           'f0tonakusaw3@10mail.xyz',
                           'fruheixuhigi-9830@yopmail.com',
                           'heigracretreko-8987@yopmail.com',
                           'etlplpxyi@emltmp.com',
                           'frukibrollaxeu-1014@yopmail.com',
                           'tuzoilobizou-6945@yopmail.com',
                           'f1mapubypaz3@10mail.xyz',
                           'teffezigradu-8577@yopmail.com',
                           'takotridouxa-1757@yopmail.com',
                           'lettanauddurou-8213@yopmail.com',
                           '04dcgnm6z0@freeml.net',
                           'prenipruprawu-2814@yopmail.com',
                           'gragifrokaha-6940@yopmail.com',
                           'tgsbquxyi@emltmp.com',
                           'weuladdottoddi-7186@yopmail.com',
                           'zaubraceiprate-7938@yopmail.com',
                           'vagyjusol0d2@10mail.xyz',
                           'pasuffufrefu-7813@yopmail.com',
                           'vabucugribra-5945@yopmail.com',
                           '044x05c0hm@spymail.one',
                           'frassixoupripe-3936@yopmail.com',
                           'seuqueicukonu-2970@yopmail.com',
                           'xjozmtbhg@laste.ml',
                           'brofroiquadduva-6021@yopmail.com',
                           'peisumittaro-3076@yopmail.com',
                           '044x523gam@spymail.one',
                           'nubifrubrollu-6357@yopmail.com',
                           'kowoummeucrimmo-5844@yopmail.com',
                           'qvxuqclhg@laste.ml',
                           'nauheseitricra-6171@yopmail.com',
                           'prauditouffeiju-6965@yopmail.com',
                           'ligroigopewu-2267@yopmail.com',
                           '0448bb30x0@spymail.one',
                           'woiddozoseppe-8070@yopmail.com',
                           'croubetteuprutri-6011@yopmail.com',
                           'xa9b4dz3@flymail.tk',
                           'frassipagrouppe-5467@yopmail.com',
                           'keddaddutreva-3676@yopmail.com',
                           'ahgnylstl@10mail.org',
                           'zoreuduvecei-6710@yopmail.com',
                           'mauttabratrufreu-8248@yopmail.com',
                           'agfjdafqn@yomail.info',
                           'quessaububivei-8743@yopmail.com',
                           'khgthklhg@laste.ml',
                           'xipratroitreuwe-5105@yopmail.com',
                           'peppequapratte-8534@yopmail.com',
                           'treweifreupribra-5751@yopmail.com',
                           'mvnfoxyxh@emlpro.com',
                           'ruzappillegi-6299@yopmail.com',
                           'prammudeuyeihe-6892@yopmail.com',
                           'tultwmlhg@laste.ml',
                           'vaudocezave-3740@yopmail.com',
                           'x7qymw4a@flymail.tk',
                           'tralahewule-3327@yopmail.com',
                           'fujuroiseusseu-3641@yopmail.com',
                           'ahgoedabf@10mail.org',
                           'pipubicahe-8389@yopmail.com',
                           'brapeifrippeffi-3429@yopmail.com',
                           'proigromakoimmo-7633@yopmail.com',
                           '044y8b493w@spymail.one',
                           'loiwesaxutto-3674@yopmail.com',
                           'tthwzsyyi@emltmp.com',
                           'reicrimmoiteufo-2943@yopmail.com',
                           'preuquedouttese-7245@yopmail.com',
                           '04dr60j07w@freeml.net',
                           'peudeunneigequou-1363@yopmail.com',
                           'cuddipratropri-1379@yopmail.com',
                           '04ddqz7mnr@freeml.net',
                           'sozonnonimmu-8410@yopmail.com',
                           'nocraquabaha-4481@yopmail.com',
                           'orfuldqxh@emlpro.com',
                           'neimmallauprireu-2617@yopmail.com',
                           'fipolloyinno-5055@yopmail.com',
                           'x7w1yezm@flymail.tk',
                           'zammamareumeu-8108@yopmail.com',
                           'troijequajeme-8036@yopmail.com',
                           'v0wagymok0k3@10mail.xyz',
                           'xoubokeufreddi-1760@yopmail.com',
                           'goiwzhqxh@emlpro.com',
                           'dauppilugreinneu-2951@yopmail.com',
                           'daeer221@rambler.ru',
                           'hizifreigouddau-9590@yopmail.com',
                           'xrzpbje0@minimail.gq',
                           'reudeiddonnaummou-4815@yopmail.com',
                           'reipubrelayi-7880@yopmail.com',
                           '043tc5z0k4@spymail.one',
                           'creronufroinau-9127@yopmail.com',
                           'rctjhnqxh@emlpro.com',
                           'kuvaudesete-9587@yopmail.com',
                           'gixoubruxouzo-4215@yopmail.com',
                           'ahgoddaen@10mail.org',
                           'niffifraukorei-6488@yopmail.com',
                           'sodqgvzxh@emlpro.com',
                           'braunupoqueijo-5847@yopmail.com',
                           'xs2aam8f@minimail.gq',
                           'muzunnuvoki-9787@yopmail.com',
                           'yoiheugossoifou-2886@yopmail.com',
                           'x80vwjae@flymail.tk',
                           'bauppizotami-3293@yopmail.com',
                           'moubrexilunna-5733@yopmail.com',
                           '044zg4yn18@spymail.one',
                           'bedoucreikene-1699@yopmail.com',
                           'h0wuzavekow3@10mail.xyz',
                           'peullijayekeu-5518@yopmail.com',
                           'brecreiyafravo-7309@yopmail.com',
                           'zuniv1puj1h2@10mail.xyz',
                           'geudicriquoho-5088@yopmail.com',
                           'peubripruttitrei-3917@yopmail.com',
                           '044znxb6w0@spymail.one',
                           'sezuttoibrique-3260@yopmail.com',
                           'gahoibrutriyi-9037@yopmail.com',
                           'x83yz74r@flymail.tk',
                           'voizeuguffeca-2812@yopmail.com',
                           'ratremufuro-8396@yopmail.com',
                           'ahgfduzcx@10mail.org',
                           'zebrubreroixau-2591@yopmail.com',
                           'futtewapepri-2042@yopmail.com',
                           'xs67xsme@minimail.gq',
                           'froxouleuzihe-1267@yopmail.com',
                           '044zxjz84m@spymail.one',
                           'toigeipahodu-7522@yopmail.com',
                           'gkoiikayh@emlpro.com',
                           'foiffapussavo-8008@yopmail.com',
                           'ahurloruh@emlhub.com',
                           'veutteffanawou-7056@yopmail.com',
                           '04df9pebn4@freeml.net',
                           'zeuhauyaukeivu-8374@yopmail.com',
                           'ploswrkxh@emlpro.com',
                           'loigifrutalou-4306@yopmail.com',
                           'hiprammouzouyeu-5223@yopmail.com',
                           'p0niv1biluw3@10mail.xyz',
                           'tralluffejifeu-7472@yopmail.com',
                           'xcncxdehg@laste.ml',
                           'coiremeuwipru-8695@yopmail.com',
                           'kvsgagryi@emltmp.com',
                           'frautepreimmapa-9707@yopmail.com',
                           'mamauyoillautra-3716@yopmail.com',
                           'xiqymtayh@emlpro.com',
                           'juloupperouyou-1842@yopmail.com',
                           '04dsysbky8@freeml.net',
                           'lebroinannaunoi-5287@yopmail.com',
                           'pjpjmxavh@emlhub.com',
                           'pebeigoikobra-7464@yopmail.com',
                           'gammoiketrogi-6218@yopmail.com',
                           'dufeymehg@laste.ml',
                           'jizosanonnou-9528@yopmail.com',
                           'agfcdgkmq@yomail.info',
                           'deppenagricu-4829@yopmail.com',
                           'croprabisommi-2365@yopmail.com',
                           'xsch9agy@minimail.gq',
                           'xuhamassouco-9957@yopmail.com',
                           'dat0m1jihed3@10mail.xyz',
                           'trejoukupeffa-1138@yopmail.com',
                           'greunneppacixe-9009@yopmail.com',
                           'ahgqocaue@10mail.org',
                           'tonakifrejo-8457@yopmail.com',
                           '04dtb70qqr@freeml.net',
                           'rebrammepubra-4193@yopmail.com',
                           'leloimmaufoire-3750@yopmail.com',
                           'stphbgbvh@emlhub.com',
                           'gobroubruzittu-8320@yopmail.com',
                           'fuppaddeukade-7262@yopmail.com',
                           'agfmvbbas@yomail.info',
                           'gregaulussucro-4154@yopmail.com',
                           'buvemeijissu-3052@yopmail.com',
                           'x8g14hwj@flymail.tk',
                           'protollejeunnou-1499@yopmail.com',
                           'ahgqxexmn@10mail.org',
                           'fojufrepilo-2119@yopmail.com',
                           'zebrunewaqua-9857@yopmail.com',
                           'w0hyl0fym1w2@10mail.xyz',
                           'pippuquaheze-2531@yopmail.com',
                           'maqwmssuh@emlhub.com',
                           'famuhoifullu-2645@yopmail.com',
                           'vaunaussihoubru-5129@yopmail.com',
                           'ahggynmrb@10mail.org',
                           '7hn6q1uid6@rteet.com',
                           '04dgpg5wz4@freeml.net',
                           'tyxzycohg@laste.ml',
                           'pcwlnifhg@laste.ml',
                           'xsjwjean@minimail.gq',
                           'kcvhax62q2@rteet.com',
                           'vyjesaf0s0h2@10mail.xyz',
                           'agoajxvmy@yomail.info',
                           'aismqofhg@laste.ml',
                           'vbzwglbzi@emltmp.com',
                           'jj8geigou6@rteet.com',
                           'ageoqjbkseimbw@dropmail.me',
                           'honetowedop3@10mail.xyz',
                           'ahghqfazf@10mail.org',
                           'vimyhobus0f2@10mail.xyz',
                           'jypb2wuibg@rteet.com',
                           'x8s5wn3w@flymail.tk',
                           'suw0muwonuj3@10mail.xyz',
                           '045247h0sr@spymail.one',
                           'vjly1md4n1@dpptd.com',
                           'ahghaebdg@10mail.org',
                           'qyzfthcyh@emlpro.com',
                           'zcsrdrtxh@emlpro.com',
                           '04dvv4483r@freeml.net',
                           '92x6voibzg@rteet.com',
                           '044k4f89j8@spymail.one',
                           'gieoabphg@laste.ml',
                           'ahgsdoebq@10mail.org',
                           'gypybilidah3@10mail.xyz',
                           'ahgshmcdu@10mail.org',
                           'p1kaden1guz2@10mail.xyz',
                           'czrspeuxh@emlpro.com',
                           'rrbgetcyh@emlpro.com',
                           'xsx8zpd5@minimail.gq',
                           'ageobqsdlapboq@dropmail.me',
                           'rlyerycvh@emlhub.com',
                           'swnnvnuxh@emlpro.com',
                           '7xsn5hxvkq@dpptd.com',
                           'ahgjaqsoi@10mail.org',
                           'mjfynehhg@laste.ml',
                           'vddaqruxh@emlpro.com',
                           'dbevswuuh@emlhub.com',
                           '04dk3zwqpr@freeml.net',
                           '04dk6trhdw@freeml.net',
                           'agepfkayqscfgp@dropmail.me',
                           'eazuv@mailto.plus',
                           'pohisin634@cetnob.com',
                           'isaagn6nnc@somelora.com',
                           '4d457b1bb1@mailmaxy.one',
                           'ea78b459aa@mailmaxy.one',
                           'rema7423@merepost.com',
                           'sam.henderson99@merepost.com',
                           'kurbasst@rambler.ru',
                           'bamem29794@degcos.com',
                           'aleksandrrusskij44457@gmail.com',
                           'arsen.vardanyan.8686@mail.ru',
                           'batadif984@degcos.com',
                           '89193377615@ibc74.ru',
                           'nikiforovainna1992@list.ru',
                           'i1prsfdua9jei3nws@list.ru',
                           'albertbaranov1994@list.ru',
                           'zuevajozefina2017@list.ru',
                           'uecibxlxpmvktk@list.ru',
                           'zlatikzvl52@rambler.ru',
                           'bojen408vishnya1985@list.ru',
                           'enjnkazvl782z@myrambler.ru',
                           'pavlovazarema1989@list.ru',
                           'zhenyasolovyov9090@list.ru',
                           'ndvr3ss5k7rrpqhe97g7@list.ru',
                           'bizenihs@rambler.ru',
                           'rudolfzvl52@rambler.ru',
                           'zlatabel8339@rambler.ru',
                           'rudolfro0430@rambler.ru',
                           'zavolzhyerud3567@autorambler.ru',
                           'fidasod456@abevw.com',
                           'sergeevagca1966@list.ru',
                           'burovabajena2951@list.ru',
                           'asfranvoronov2410@list.ru',
                           'zgoeleznw3@qzueos.com',
                           'milana77@gonetor.com',
                           'maiyamyasnikova5947@list.ru',
                           'abiyapopova9637@list.ru',
                           'vilgelmignatov5344@list.ru',
                           'dudemos@zlorkun.com',
                           'efremovb@rambler.ru',
                           'gushchinawnl1974@list.ru',
                           'grigorevasgt1986@list.ru',
                           'gerasimovavmk1997@list.ru',
                           'kabanovapvd1980@list.ru',
                           'romanovahtp1990@list.ru',
                           'biryukovaarb1987@list.ru',
                           'dorofeevaxlz1989@list.ru',
                           'maksimovahme1990@list.ru',
                           'ershovapyb1985@list.ru',
                           'kudryashovatle1981@list.ru',
                           'filippovafer1967@list.ru',
                           'gurevarad1990@list.ru',
                           'kulaginalrt1970@list.ru',
                           'panfilovazir1987@list.ru',
                           'konstantinovajfc1997@list.ru',
                           'osipovabsa1994@list.ru',
                           'kiselyovawqo1974@list.ru',
                           'blinovayss1983@list.ru',
                           'sitnikovamhc1995@list.ru',
                           'tsvetkovaeey1974@list.ru',
                           'silinaleu1968@list.ru',
                           'kovalyovawep1980@list.ru',
                           'dementevajap1973@list.ru',
                           'lobanovaxjh1971@list.ru',
                           'lytkinaivq1976@list.ru',
                           'sharovaqso1987@list.ru',
                           'smirnovaira1966@list.ru',
                           'sergeevarbt1978@list.ru',
                           'pestovaekp1982@list.ru',
                           'belyaevacus1970@list.ru',
                           'kalininakzz1966@list.ru',
                           'belyakovavxb1986@list.ru',
                           'kuzminajhi1991@list.ru',
                           'makarovausg1985@list.ru',
                           'volkovavwa1978@list.ru',
                           'odintsovallq1987@list.ru',
                           'sharapovanxq1981@list.ru',
                           'panovaytj1996@list.ru',
                           'markovased1974@list.ru',
                           'polyakovaijh1970@list.ru',
                           'petukhovabqt1979@list.ru',
                           'strelkovadby1983@list.ru',
                           'zuevajgn1985@list.ru',
                           'samoylovamws1968@list.ru',
                           'orekhovanzb1970@list.ru',
                           'markovadnn1988@list.ru',
                           'kazakovaekv1989@list.ru',
                           'rodionovairj1976@list.ru',
                           'kolesnikovarez1980@list.ru',
                           'romanovaolm1976@list.ru',
                           'vasilevadrv1978@list.ru',
                           'gurevannx1995@list.ru',
                           'komarovaooq1997@list.ru',
                           'ignatovajvs1983@list.ru',
                           'sysoevapso1970@list.ru',
                           'ivanovarkc1990@list.ru',
                           'gurevaday1975@list.ru',
                           'nesterovavbu1993@list.ru',
                           'blokhinajkq1989@list.ru',
                           'orekhovavuq1966@list.ru',
                           'kiselyovacly1978@list.ru',
                           'kolesnikovavet1993@list.ru',
                           'panfilovapcq1986@list.ru',
                           'voronovaxfb1991@list.ru',
                           'voronovaiur1986@list.ru',
                           'chernovanck1983@list.ru',
                           'seleznyovaggb1971@list.ru',
                           'sharovakne1981@list.ru',
                           'subbotinakbp1984@list.ru',
                           'gordeevafnk1977@list.ru',
                           'belyaevaibi1991@list.ru',
                           'ignatovajsn1993@list.ru',
                           'muravyovanty1967@list.ru',
                           'moiseevalkg1969@list.ru',
                           'chernovaqoz1986@list.ru',
                           'evdokimovalxv1974@list.ru',
                           'biryukovaegi1982@list.ru',
                           'aleksandrovaxep1982@list.ru',
                           'gorbunovaxes1984@list.ru',
                           'petukhovalzq1984@list.ru',
                           'gorbachyovaiwf1967@list.ru',
                           'subbotinaaxj1976@list.ru',
                           'kolesnikovadaf1991@list.ru',
                           'zinovevaqrn1967@list.ru',
                           'kolesnikovafgq1987@list.ru',
                           'lobanovaqjy1997@list.ru',
                           'yudinazrd1980@list.ru',
                           'timofeevavzs1973@list.ru',
                           'kiselyovaxzw1984@list.ru',
                           'sitnikovaprk1971@list.ru',
                           'pavlovaznj1967@list.ru',
                           'abramovacuf1985@list.ru',
                           'ershovafoe1977@list.ru',
                           'tsvetkovatqu1966@list.ru',
                           'romanovadck1980@list.ru',
                           'terentevavgc1970@list.ru',
                           'shiryaevahhz1967@list.ru',
                           'bespalovagur1970@list.ru',
                           'komissarovanwu1985@list.ru',
                           'vorobyovairp1975@list.ru',
                           'fomichyovamfk1997@list.ru',
                           'myasnikovabnw1990@list.ru',
                           'dmitrievardv1981@list.ru',
                           'kuznetsovazxk1979@list.ru',
                           'naumovaqbn1985@list.ru',
                           'vorontsovahrj1975@list.ru',
                           'loginovadgj1984@list.ru',
                           'abramovansc1989@list.ru',
                           'martynovavsh1984@list.ru',
                           'safonovadem1996@list.ru',
                           'drozdovafxv1972@list.ru',
                           'sidorovabnx1979@list.ru',
                           'doroninaqsu1972@list.ru',
                           'filippovaieh1977@list.ru',
                           'myasnikovafui1994@list.ru',
                           'kirillovambp1984@list.ru',
                           'baranovayac1975@list.ru',
                           'komissarovaijh1992@list.ru',
                           'kudryavtsevavrt1973@list.ru',
                           'nekrasovarrv1991@list.ru',
                           'solovyovaivc1996@list.ru',
                           'sharapovagjq1997@list.ru',
                           'blokhinaewj1973@list.ru',
                           'strelkovanpj1970@list.ru',
                           'fedoseevaxdo1968@list.ru',
                           'burovaauk1992@list.ru',
                           'fominaebv1978@list.ru',
                           'orekhovaadw1984@list.ru',
                           'danilovabjq1988@list.ru',
                           'zykovabzv1993@list.ru',
                           'grishinarhg1975@list.ru',
                           'kuznetsovanev1972@list.ru',
                           'vlasovafoq1966@list.ru',
                           'fomichyovacwh1977@list.ru',
                           'efimovaaoo1974@list.ru',
                           'sokolovapva1993@list.ru',
                           'zinovevalzs1982@list.ru',
                           'panfilovaqhe1971@list.ru',
                           'caeemlerec1988@rambler.ru',
                           'mma02@rambler.ru',
                           'zaya2308@rambler.ru',
                           'cd37a5e53e@mailmaxy.one',
                           'svetatarasova1991@list.ru',
                           '861600d518@mailmaxy.one',
                           '33c19f0a5d@mailmaxy.one',
                           'a092e80ed0@mailmaxy.one',
                           '6f41495bfa@mailmaxy.one',
                           'aa7ace0ee4@mailmaxy.one',
                           'd1f6f0e46c@mailmaxy.one',
                           'd7fe5783fc@mailmaxy.one',
                           'd8c94fbd89@mailmaxy.one',
                           '1aea2878c1@mailmaxy.one',
                           '3d05478666@mailmaxy.one',
                           'eaac83d7bd@mailmaxy.one',
                           'e990c2a579@mailmaxy.one',
                           '55b2671642@mailmaxy.one',
                           'faa28e2302@mailmaxy.one',
                           'denisovayuf1982@list.ru',
                           'doroninajns1969@list.ru',
                           'frolovatuy1974@list.ru',
                           '5a0744b9bb@mailmaxy.one',
                           'kabanovadmt1992@list.ru',
                           'bec06fa9d3@mailmaxy.one',
                           'nesterovalmm1981@list.ru',
                           'isakovakmy1988@list.ru',
                           'trofimovagbl1990@list.ru',
                           'f1c97f70d6@mailmaxy.one',
                           'golubevakoa1968@list.ru',
                           'zhuravlyovaqmc1973@list.ru',
                           'egorovaete1995@list.ru',
                           'kovalyovadod1977@list.ru',
                           'zhuravlyovapnh1980@list.ru',
                           'chernovaxft1979@list.ru',
                           'nazarovacbq1976@list.ru',
                           'davydovaxvm1970@list.ru',
                           'fyodorovavlv1980@list.ru',
                           'fedoseevaelj1991@list.ru',
                           'morozovabpu1988@list.ru',
                           'efimovaqpk1988@list.ru',
                           'ivanovanag1978@list.ru',
                           'koshelevacgd1968@list.ru',
                           'sharovardl1993@list.ru',
                           'tsvetkovaupz1977@list.ru',
                           'ce2118aed4@mailmaxy.one',
                           'rodionovauze1977@list.ru',
                           'yakovlevaqjw1993@list.ru',
                           'konovalovaago1972@list.ru',
                           'kudryavtsevasnf1970@list.ru',
                           '1da6a68c27@mailmaxy.one',
                           'belovaxiq1988@list.ru',
                           'rodionovapec1966@list.ru',
                           'vasilevaedq1981@list.ru',
                           'c4cc0416c4@mailmaxy.one',
                           'savinatpn1996@list.ru',
                           'vorontsovaqjj1970@list.ru',
                           'abcfcffc35@mailmaxy.one',
                           'koshelevaxue1986@list.ru',
                           'sharapovafwr1980@list.ru',
                           'samsonovaxzr1988@list.ru',
                           'e6ec00ab86@mailmaxy.one',
                           'loginovajzx1968@list.ru',
                           'odintsovartx1990@list.ru',
                           '0ee806dac3@mailmaxy.one',
                           'samsonovautz1974@list.ru',
                           'f1c9a4ce02@mailmaxy.one',
                           'yakovlevatam1968@list.ru',
                           'markovaicb1994@list.ru',
                           'seliverstovaiac1980@list.ru',
                           'fbbece532e@mailmaxy.one',
                           'ryabovaojy1985@list.ru',
                           'tretyakovazlc1972@list.ru',
                           '6d07adcaaa@mailmaxy.one',
                           'simonovayml1967@list.ru',
                           'sitnikovabtk1989@list.ru',
                           'evdokimovavxw1968@list.ru',
                           '040d82baf8@mailmaxy.one',
                           'konovalovarzj1990@list.ru',
                           'gorshkovaogx1993@list.ru',
                           'larionovaptu1974@list.ru',
                           'smirnovayfh1973@list.ru',
                           'drozdovapjq1981@list.ru',
                           'bobylyovanwj1971@list.ru',
                           'ovchinnikovaqam1974@list.ru',
                           'kudryavtsevaakm1992@list.ru',
                           'kapustinazov1995@list.ru',
                           'tarasovabet1982@list.ru',
                           'yakovlevappv1992@list.ru',
                           'sobolevalxo1990@list.ru',
                           'f5797457e8@mailmaxy.one',
                           'ershovampn1972@list.ru',
                           'knyazevakuu1996@list.ru',
                           'bolshakovahpj1967@list.ru',
                           'uvarovabpc1967@list.ru',
                           'rozhkovackr1974@list.ru',
                           'kornilovatrl1986@list.ru',
                           'lapinacbu1989@list.ru',
                           'lapinafbw1993@list.ru',
                           'tsvetkovaqzu1974@list.ru',
                           'markovaekx1988@list.ru',
                           'odintsovaxio1997@list.ru',
                           'naumovasmy1980@list.ru',
                           'lapinagbc1991@list.ru',
                           'alekseevatbd1986@list.ru',
                           'korolyovapnc1987@list.ru',
                           'bobylyovatqq1983@list.ru',
                           'muravyovaryi1968@list.ru',
                           'kudryavtsevaxlw1972@list.ru',
                           'komissarovaree1997@list.ru',
                           '012869382e@mailmaxy.one',
                           'rodionovawzo1996@list.ru',
                           'rybakovamxg1984@list.ru',
                           'd8b812179a@mailmaxy.one',
                           'sazonovaoww1987@list.ru',
                           'orekhovaakh1969@list.ru',
                           '667d9c6ea8@mailmaxy.one',
                           'trofimovabxg1970@list.ru',
                           'abramovakmz1971@list.ru',
                           'efimovagio1979@list.ru',
                           'martynovafbj1969@list.ru',
                           'teterinabxo1968@list.ru',
                           'myasnikovashf1987@list.ru',
                           'rogovaogc1970@list.ru',
                           'petukhovasul1981@list.ru',
                           'belozyorovaslw1992@list.ru',
                           'filippovaebc1984@list.ru',
                           'rodionovaoba1991@list.ru',
                           'silinawzm1995@list.ru',
                           'zhuravlyovaigj1986@list.ru',
                           'tarasovacgr1981@list.ru',
                           'polyakovalgj1971@list.ru',
                           'agafonovamne1991@list.ru',
                           'fomichyovadnr1969@list.ru',
                           'nazarovauta1970@list.ru',
                           'gushchinaunn1981@list.ru',
                           'fadeevaiuc1980@list.ru',
                           'vasilevaosl1978@list.ru',
                           'mikheevazhk1984@list.ru',
                           'kulakovajmr1970@list.ru',
                           'antonovalik1972@list.ru',
                           'belyaevajfo1982@list.ru',
                           '5dc48197d9@mailmaxy.one',
                           'fedotovatgc1971@list.ru',
                           'shchukinahuh1990@list.ru',
                           'ermakovambr1985@list.ru',
                           'romanovapdu1984@list.ru',
                           'muromalla@somelora.com',
                           'melnikovavub1970@list.ru',
                           'zakharovakoq1982@list.ru',
                           'kalininavqr1975@list.ru',
                           'yakushevafhx1990@list.ru',
                           'merkushevaeef1983@list.ru',
                           'bolshakovaqet1971@list.ru',
                           'shashkovaxzd1987@list.ru',
                           'gurevawsu1973@list.ru',
                           'vladimirovapvm1976@list.ru',
                           'chernovanir1988@list.ru',
                           'fyodorovakbs1981@list.ru',
                           'kabanovacgd1996@list.ru',
                           'markka@dygovil.com',
                           'sokolovafqs1967@list.ru',
                           'bobrovazod1980@list.ru',
                           'bolshakovagoh1981@list.ru',
                           'panfilovagyj1978@list.ru',
                           'avblokhin@yahoo.com',
                           'nikonovawni1971@list.ru',
                           'bobrovabiy1997@list.ru',
                           'karpovaydk1987@list.ru',
                           'martynovaade1986@list.ru',
                           'knyazevafio1988@list.ru',
                           'knyazevaaxh1973@list.ru',
                           'krylovaemf1975@list.ru',
                           'lukinaggv1989@list.ru',
                           'shubinadgx1995@list.ru',
                           'stepanovaipv1993@list.ru',
                           'golubevaaud1995@list.ru',
                           'rodionovavov1966@list.ru',
                           'kiu@tippabble.com',
                           '06e528cb9c@mailmaxy.one',
                           'emelyanovatqz1985@list.ru',
                           'sorokinaiiz1972@list.ru',
                           'samsonovajds1993@list.ru',
                           'c8518b20e5@mailmaxy.one',
                           'kuznetsovavxf1967@list.ru',
                           'liza@knmcadibav.com',
                           'golubevarer1978@list.ru',
                           '644df65282@mailmaxy.one',
                           'pakhomovafhc1990@list.ru',
                           'krylovaxvp1981@list.ru',
                           'sasha@somelora.com',
                           'panovahwk1978@list.ru',
                           'roma@knmcadibav.com',
                           'f85ae26f37@mailmaxy.one',
                           'belozerovasofiya5641@list.ru',
                           'c8519ae564@mailmaxy.one',
                           'duzev@qejjyl.com',
                           'aboss@rfcdrive.com',
                           'azimuth@bltiwd.com',
                           'angular@tippabble.com',
                           'o7vf5@rustyload.com',
                           '70e17c0b5b@mailmaxy.one',
                           'e68f824f8e@mailmaxy.one',
                           'slyava@rfcdrive.com',
                           'lobanovaliq1977@list.ru',
                           'shubinalsl1968@list.ru',
                           'dementevaavg1978@list.ru',
                           'krylovalxr1986@list.ru',
                           'titovavgz1970@list.ru',
                           'sukhanovatsg1994@list.ru',
                           'fedotovawhi1980@list.ru',
                           'nesterovadsd1972@list.ru',
                           'avdeevaoqs1969@list.ru',
                           'orlovaqcg1983@list.ru',
                           'korolyovampe1976@list.ru',
                           'lapinaohi1986@list.ru',
                           'filatovaaml1988@list.ru',
                           'belyakovazjs1988@list.ru',
                           'davydovaqbo1993@list.ru',
                           'maslovaygu1967@list.ru',
                           'loginovawtj1988@list.ru',
                           '279e7743b5@mailmaxy.one',
                           '80f93eddf9@mailmaxy.one',
                           'kulaginaird1995@list.ru',
                           'nekrasovarrw1990@list.ru',
                           'fadeevakfl1988@list.ru',
                           'kharitonovajlg1975@list.ru',
                           'dorofeevahsr1967@list.ru',
                           'bespalovapxe1980@list.ru',
                           'silinaosr1967@list.ru',
                           'zuevalzk1997@list.ru',
                           'fedoseevaizm1967@list.ru',
                           'kapustinafvg1987@list.ru',
                           'likhachyovapbu1985@list.ru',
                           'shestakovauiu1969@list.ru',
                           'doroninaktf1974@list.ru',
                           'rogovaqwf1991@list.ru',
                           'davydovadvd1994@list.ru',
                           'q57k0@rustyload.com',
                           '43824de943@mailmaxy.one',
                           'yakovlevaecs1967@list.ru',
                           'aksyonovadow1988@list.ru',
                           'kopylovaoxn1986@list.ru',
                           'tsvetkovavnq1977@list.ru',
                           'korolyovaarh1980@list.ru',
                           'fominadcd1997@list.ru',
                           'efremovacql1972@list.ru',
                           'bogdanovadfb1987@list.ru',
                           'shchukinavjb1990@list.ru',
                           'kryukovadmc1990@list.ru',
                           'krylovazco1996@list.ru',
                           'fedoseevaypo1997@list.ru',
                           'luda@bltiwd.com',
                           'silinazcw1988@list.ru',
                           'ovchinnikovayoa1973@list.ru',
                           'aleksandrovaiav1974@list.ru',
                           'kapustinakvy1973@list.ru',
                           'golubevahnj1987@list.ru',
                           'denisovavtu1982@list.ru',
                           'grishinaqfp1968@list.ru',
                           'blokhinatmt1991@list.ru',
                           'solovyovampf1975@list.ru',
                           'panovalwe1987@list.ru',
                           'potapovaoix1976@list.ru',
                           'myasnikovaqsf1988@list.ru',
                           'komarovaczl1972@list.ru',
                           'muravyovaium1983@list.ru',
                           'kozlovatdv1967@list.ru',
                           'gulyaevalda1975@list.ru',
                           'chernovaqil1988@list.ru',
                           'krylovaijq1969@list.ru',
                           'naumovarao1990@list.ru',
                           'savinakoy1975@list.ru',
                           'romanovagat1980@list.ru',
                           'evseevatay1983@list.ru',
                           'dmitrievamvp1970@list.ru',
                           'bespalovaaeo1993@list.ru',
                           'mukhinartk1982@list.ru',
                           'bolshakovajko1987@list.ru',
                           'panovavcr1967@list.ru',
                           'lobanovawtw1968@list.ru',
                           'braginaxqk1967@list.ru',
                           'bogdanovagpp1993@list.ru',
                           'muravyovagkk1990@list.ru',
                           'doroninalxg1973@list.ru',
                           'vishnyakovaezu1992@list.ru',
                           'zaytsevajdd1979@list.ru',
                           'ustinovazrk1968@list.ru',
                           'danilovaqxp1993@list.ru',
                           'evdokimova_1980@list.ru',
                           '83qvbsnijb@smykwb.com',
                           '35b710b256@mailmaxy.one',
                           'milana14@smykwb.com',
                           'michalchuk@tidissajiiu.com',
                           'frola00@rambler.ru',
                           'smallapricot@rustyload.com',
                           'geetanjali.pellot@allwebemails.com',
                           'zayven.april@allwebemails.com',
                           'dazlynn.mcilvaine@horizonspost.com',
                           'noskovaovz1995@list.ru',
                           'melnikovavoh1975@list.ru',
                           'sazonovatze1978@list.ru',
                           'tretyakovanbl1971@list.ru',
                           'gerasimovaejv1979@list.ru',
                           'd4vv0ye3dy@dpptd.com',
                           'ignatovareq1987@list.ru',
                           'tsvetkovazfi1987@list.ru',
                           'kudryavtsevakxp1990@list.ru',
                           'krylovajsf1980@list.ru',
                           'belovawva1995@list.ru',
                           'volkovatyd1986@list.ru',
                           'tilisa.mcconnaughy@allfreemail.net',
                           'gerasimovavpk1968@list.ru',
                           'matveevadpu1986@list.ru',
                           'lytkinatju1968@list.ru',
                           'nekrasovapwm1974@list.ru',
                           'raigyn.hoyle@easymailer.live',
                           'morozovajil1992@list.ru',
                           'lavrentevarvy1980@list.ru',
                           'panovakjr1985@list.ru',
                           'lavrentevaxdn1985@list.ru',
                           'alekseevaami1978@list.ru',
                           'galkinafxl1982@list.ru',
                           'zaytsevakra1971@list.ru',
                           'denisovalsl1983@list.ru',
                           'orekhovahpu1991@list.ru',
                           'ponomaryovardv1982@list.ru',
                           'shcherbakovafvq1967@list.ru',
                           'aksyonovafcw1983@list.ru',
                           'nekrasovaifu1997@list.ru',
                           'dyachkovacfa1997@list.ru',
                           'pavlovadus1970@list.ru',
                           '8udqlt4zzj@dpptd.com',
                           'fedoseevaxvf1996@list.ru',
                           'isakovagzh1987@list.ru',
                           'sazonovavxx1988@list.ru',
                           'ov9u0yrc64@dpptd.com',
                           'sidorovaewd1976@list.ru',
                           'eliseevavek1973@list.ru',
                           'kalashnikovawxv1978@list.ru',
                           'ermakovaqwl1980@list.ru',
                           'jerrome.nakken@solarnyx.com',
                           'seleznyovatsu1980@list.ru',
                           'belousovabsw1978@list.ru',
                           'galkinanvf1988@list.ru',
                           'aksyonovafcc1972@list.ru',
                           'nashley.pauls@solarnyx.com',
                           'prokhorovasfj1989@list.ru',
                           'bogdanovaqgw1970@list.ru',
                           'abramovasqp1988@list.ru',
                           'maslovahnn1993@list.ru',
                           'zenaya.clerk@allfreemail.net',
                           'fokinahas1966@list.ru',
                           'simonovatgq1982@list.ru',
                           'doroninataf1982@list.ru',
                           'doroninaird1969@list.ru',
                           'sergeevaxct1981@list.ru',
                           'korolyovarzt1967@list.ru',
                           'biryukovauze1990@list.ru',
                           'vlasovakps1972@list.ru',
                           'tamisha.weld@mailmagnet.co',
                           'ignatevarrs1995@list.ru',
                           'grishinazko1993@list.ru',
                           'm5sxl1dkrh@rteet.com',
                           'vorobyovahbt1970@list.ru',
                           'larionovapog1968@list.ru',
                           'romanovalby1991@list.ru',
                           'lorelia.dirksen@allwebemails.com',
                           'likhachyovawhv1985@list.ru',
                           'kopylovahbs1997@list.ru',
                           'strelkovagqg1967@list.ru',
                           'gusevaltl1994@list.ru',
                           'molchanovajmc1983@list.ru',
                           'humaid.willits@solarnyx.com',
                           'kulikovauod1971@list.ru',
                           'belovamxe1997@list.ru',
                           'ponomaryovadzd1987@list.ru',
                           'kotovavtb1983@list.ru',
                           'zaytsevarwe1985@list.ru',
                           'veselovajeu1975@list.ru',
                           'shauntelle.lever@easymailer.live',
                           'pestovaseh1994@list.ru',
                           'orekhovawmq1980@list.ru',
                           'gerasimovajsn1993@list.ru',
                           'raeona.polito@easymailer.live',
                           'fyodorovamty1990@list.ru',
                           'evseevadzo1986@list.ru',
                           'seleznyovacsb1971@list.ru',
                           'rybakovaozk1985@list.ru',
                           'rusakovasqz1972@list.ru',
                           'nikitinahdo1989@list.ru',
                           'gordeevambm1997@list.ru',
                           'ovchinnikovahjk1966@list.ru',
                           'josse.whiteside@allwebemails.com',
                           'isakovauur1986@list.ru',
                           'markovaxtg1968@list.ru',
                           'w9wdeoie6v@rteet.com',
                           'vlasovabgw1983@list.ru',
                           'komissarovafwn1993@list.ru',
                           'komissarovajwe1966@list.ru',
                           'konstantinovavri1972@list.ru',
                           'loginovahsc1981@list.ru',
                           'belozyorovaoha1983@list.ru',
                           'gorbachyovaixf1987@list.ru',
                           'knyazevaegu1977@list.ru',
                           'kozlovaepz1971@list.ru',
                           'ponomaryovacae1976@list.ru',
                           'lukinaswz1983@list.ru',
                           'solovyovazym1967@list.ru',
                           'blinovakow1992@list.ru',
                           'bobrovaaqf1972@list.ru',
                           'kalininayyv1968@list.ru',
                           'abramovairm1986@list.ru',
                           'ermakovahqk1972@list.ru',
                           'kirillovahof1984@list.ru',
                           'kulaginaumb1994@list.ru',
                           'voronovauxp1983@list.ru',
                           'sukhanovaqoo1980@list.ru',
                           'mikheevastg1986@list.ru',
                           'agafonovasww1986@list.ru',
                           '6wxz6u8mt5@rteet.com',
                           'voronovaaob1995@list.ru',
                           'strelkovafmb1984@list.ru',
                           'vlasovabol1987@list.ru',
                           'gavrilovaquy1982@list.ru',
                           'orlovawkz1966@list.ru'
            )

    `
    return {}
  }

  async createFile(
    path: string,
    fileName: string,
    data: string,
  ): Promise<void> {
    // if (!this.checkIfFileOrDirectoryExists(path)) {
    //   fs.mkdirSync(path);
    // }

    const writeFiles = promisify(writeFile);

    return await writeFiles(`${path}/${fileName}`, data, 'utf8');
  }

  async findManyUsersByName(name: string): Promise<any> {
    return this.dbService.user.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        name: {
          contains: name
        }
      },
      include: {
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }

  async findFirstSongById(id: number): Promise<any> {
    const song = "https://firebasestorage.googleapis.com/v0/b/testing-98cd8.appspot.com/o/images%2F1725226282184?alt=media&token=5c0ccc8f-f8d1-4c65-8385-e21b695de6cb"
    const readStream = createReadStream(song)
    return new StreamableFile(readStream)
    return this.dbService.song.findFirst({
      where: {
        id: id
      }
    })
  }

}
